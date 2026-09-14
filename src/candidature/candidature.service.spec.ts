import { Test, TestingModule } from '@nestjs/testing';
import { CandidatureService } from './candidature.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CandidatureStatus, Prisma } from 'generated/prisma';

jest.mock('src/utils/cloudinary', () => ({
  uploadImageToCloudinary: jest
    .fn()
    .mockResolvedValue('https://cloudinary.url/file.jpg'),
}));
jest.mock('src/utils/expo-push', () => ({
  bi: jest.fn((fr: string) => fr),
  isValidExpoToken: jest.fn(() => false),
  sendExpoPush: jest.fn(),
}));
jest.mock('sharp', () => {
  const sharpInstance = {
    jpeg: jest.fn().mockReturnThis(),
    toBuffer: jest.fn().mockResolvedValue(Buffer.from('compressed')),
    resize: jest.fn().mockReturnThis(),
    metadata: jest.fn().mockResolvedValue({ width: 100, height: 100 }),
  };
  return jest.fn(() => sharpInstance);
});

const prisma = {
  user: { findFirst: jest.fn(), findMany: jest.fn() },
  medecinHopital: { findMany: jest.fn(), count: jest.fn(), upsert: jest.fn() },
  candidature: {
    findUnique: jest.fn(),
    findMany: jest.fn() as jest.Mock<
      any,
      [{ where: Prisma.CandidatureWhereInput }]
    >,
    count: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    delete: jest.fn(),
  },
  reservation: { count: jest.fn() },
  feedback: { aggregate: jest.fn() },
  notification: { create: jest.fn() },
  $transaction: jest.fn(),
};

describe('CandidatureService', () => {
  let service: CandidatureService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CandidatureService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(CandidatureService);
  });

  // ─── CREATE ──────────────────────────────────────────────────────────
  describe('create', () => {
    const dto = {
      medecinId: 1,
      hopitalIds: [10, 20],
      description: 'test desc',
      file: '',
    };

    it('should create candidatures successfully', async () => {
      prisma.user.findFirst.mockResolvedValue({
        userId: 1,
        firstName: 'Doc',
        lastName: 'Tor',
        speciality: null,
        expotoken: null,
      });
      prisma.user.findMany.mockResolvedValue([
        { userId: 10, firstName: 'H1', hospitalName: 'HopA', city: 'Paris' },
        { userId: 20, firstName: 'H2', hospitalName: 'HopB', city: 'Lyon' },
      ]);
      prisma.medecinHopital.findMany.mockResolvedValue([]);
      prisma.candidature.findMany.mockResolvedValue([]);

      const created = [
        {
          candidatureId: 1,
          medecinId: 1,
          hopitalId: 10,
          status: CandidatureStatus.PENDING,
        },
        {
          candidatureId: 2,
          medecinId: 1,
          hopitalId: 20,
          status: CandidatureStatus.PENDING,
        },
      ];

      prisma.$transaction.mockImplementation(
        (fnOrArray: Array<unknown> | ((tx: unknown) => Promise<unknown>)) => {
          if (typeof fnOrArray === 'function') {
            const tx = {
              medecinHopital: { upsert: jest.fn() },
              candidature: { update: jest.fn() },
            };
            return fnOrArray(tx);
          }
          return created;
        },
      );

      const result = await service.create(dto);

      expect(result.data).toHaveLength(2);
      expect(result.message).toContain('2 candidature(s)');
      expect(result.skipped.alreadyAffiliated).toEqual([]);
      expect(result.skipped.alreadyPending).toEqual([]);
    });

    it('should return empty data when all hospitals are affiliated or pending', async () => {
      prisma.user.findFirst.mockResolvedValue({
        userId: 1,
        firstName: 'Doc',
        lastName: 'Tor',
        speciality: null,
        expotoken: null,
      });
      prisma.user.findMany.mockResolvedValue([
        { userId: 10, firstName: 'H1', hospitalName: 'HopA', city: 'Paris' },
      ]);
      prisma.medecinHopital.findMany.mockResolvedValue([{ hopitalId: 10 }]);
      prisma.candidature.findMany.mockResolvedValue([]);

      const result = await service.create({ ...dto, hopitalIds: [10] });

      expect(result.data).toEqual([]);
      expect(result.skipped.alreadyAffiliated).toEqual([10]);
    });

    it('should throw NotFoundException if medecin not found', async () => {
      prisma.user.findFirst.mockResolvedValue(null);

      await expect(service.create({ ...dto, medecinId: 999 })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if hospital not found', async () => {
      prisma.user.findFirst.mockResolvedValue({
        userId: 1,
        firstName: 'Doc',
        lastName: 'Tor',
        speciality: null,
        expotoken: null,
      });
      prisma.user.findMany.mockResolvedValue([]);

      await expect(service.create(dto)).rejects.toThrow(NotFoundException);
    });
  });

  // ─── FIND ALL ────────────────────────────────────────────────────────
  describe('findAll', () => {
    it('should return paginated items', async () => {
      const items = [{ candidatureId: 1 }];
      const total = 1;

      prisma.$transaction.mockResolvedValue([items, total]);

      const result = await service.findAll({ page: 1, limit: 20 } as any);

      expect(result.data).toEqual(items);
      expect(result.meta.total).toBe(1);
      expect(result.meta.pageCount).toBe(1);
    });

    it('should apply status filter', async () => {
      prisma.$transaction.mockResolvedValue([[], 0]);

      await service.findAll({
        page: 1,
        limit: 20,
        status: CandidatureStatus.PENDING,
      } as any);

      const findManyWhere = prisma.candidature.findMany.mock.calls[0][0].where;
      expect(findManyWhere.status).toBe(CandidatureStatus.PENDING);
    });

    it('should apply search filter with OR', async () => {
      prisma.$transaction.mockResolvedValue([[], 0]);

      await service.findAll({ page: 1, limit: 20, search: 'cardio' } as any);

      const findManyWhere = prisma.candidature.findMany.mock.calls[0][0].where;
      expect(findManyWhere.OR).toBeDefined();
      expect(findManyWhere.OR?.length ?? 0).toBeGreaterThan(0);
    });
  });

  // ─── FIND ONE ────────────────────────────────────────────────────────
  describe('findOne', () => {
    it('should return a candidature with extra data', async () => {
      const candidature = {
        candidatureId: 1,
        description: 'desc',
        file: null,
        status: CandidatureStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
        medecinId: 1,
        hopitalId: 10,
        medecin: {
          userId: 1,
          firstName: 'Doc',
          lastName: 'Tor',
          speciality: null,
        },
        hopital: {
          userId: 10,
          firstName: 'H1',
          hospitalName: 'HopA',
          city: 'Paris',
        },
      };

      prisma.candidature.findUnique.mockResolvedValue(candidature);
      prisma.$transaction.mockResolvedValue([5, { _avg: { note: 4.5 } }, 0]);

      const result = await service.findOne(1);

      expect(result.data.candidatureId).toBe(1);
      expect(result.data.alreadyAffiliated).toBe(false);
      expect(result.data.medecin.totalConsultations).toBe(5);
      expect(result.data.medecin.averageFeedbackOnFive).toBe(4.5);
    });

    it('should throw NotFoundException if not found', async () => {
      prisma.candidature.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  // ─── UPDATE ──────────────────────────────────────────────────────────
  describe('update', () => {
    const pendingCandidature = {
      candidatureId: 1,
      description: 'old desc',
      file: null,
      status: CandidatureStatus.PENDING,
      medecinId: 1,
      hopitalId: 10,
      medecin: { firstName: 'Doc', lastName: 'Tor' },
      hopital: {
        userId: 10,
        firstName: 'H1',
        hospitalName: 'HopA',
        city: 'Paris',
      },
    };

    it('should update a PENDING candidature', async () => {
      prisma.candidature.findUnique.mockResolvedValue({
        ...pendingCandidature,
      });
      prisma.candidature.update.mockResolvedValue({
        ...pendingCandidature,
        description: 'new desc',
      });

      const result = await service.update(1, {
        description: 'new desc',
      } as any);

      expect(prisma.candidature.update).toHaveBeenCalled();
      expect(result.message).toContain('succès');
    });

    it('should throw NotFoundException if not found', async () => {
      prisma.candidature.findUnique.mockResolvedValue(null);

      await expect(
        service.update(999, { description: 'x' } as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if not PENDING', async () => {
      prisma.candidature.findUnique.mockResolvedValue({
        ...pendingCandidature,
        status: CandidatureStatus.CONFIRMED,
      });

      await expect(
        service.update(1, { description: 'x' } as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── DELETE ──────────────────────────────────────────────────────────
  describe('delete', () => {
    it('should delete a candidature', async () => {
      prisma.candidature.findUnique.mockResolvedValue({ candidatureId: 1 });
      prisma.candidature.delete.mockResolvedValue({ candidatureId: 1 });

      const result = await service.delete(1);

      expect(prisma.candidature.delete).toHaveBeenCalledWith({
        where: { candidatureId: 1 },
      });
      expect(result.message).toContain('succès');
    });

    it('should throw NotFoundException if not found', async () => {
      prisma.candidature.findUnique.mockResolvedValue(null);

      await expect(service.delete(999)).rejects.toThrow(NotFoundException);
    });
  });

  // ─── CANCEL MANY ────────────────────────────────────────────────────
  describe('cancelMany', () => {
    it('should cancel PENDING and skip non-PENDING', async () => {
      prisma.candidature.findMany.mockResolvedValue([
        { candidatureId: 1, status: CandidatureStatus.PENDING },
        { candidatureId: 2, status: CandidatureStatus.CONFIRMED },
      ]);
      prisma.candidature.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.cancelMany({
        candidatureIds: [1, 2],
      } as any);

      expect(result.cancelledIds).toEqual([1]);
      expect(result.skippedIds).toEqual([2]);
      expect(prisma.candidature.updateMany).toHaveBeenCalled();
    });

    it('should skip all if none are PENDING', async () => {
      prisma.candidature.findMany.mockResolvedValue([
        { candidatureId: 1, status: CandidatureStatus.CONFIRMED },
        { candidatureId: 2, status: CandidatureStatus.CANCELLED },
      ]);

      const result = await service.cancelMany({
        candidatureIds: [1, 2],
      } as any);

      expect(result.cancelledIds).toEqual([]);
      expect(result.skippedIds).toEqual([1, 2]);
      expect(prisma.candidature.updateMany).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if no candidatures found', async () => {
      prisma.candidature.findMany.mockResolvedValue([]);

      await expect(
        service.cancelMany({ candidatureIds: [999] } as any),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─── ACCEPT ──────────────────────────────────────────────────────────
  describe('accept', () => {
    const baseCandidature = {
      candidatureId: 1,
      medecinId: 1,
      hopitalId: 10,
      status: CandidatureStatus.PENDING,
      medecin: {
        userId: 1,
        firstName: 'Doc',
        lastName: 'Tor',
        expotoken: null,
      },
      hopital: {
        userId: 10,
        firstName: 'H1',
        hospitalName: 'HopA',
        city: 'Paris',
      },
    };

    it('should accept a PENDING candidature', async () => {
      prisma.candidature.findUnique.mockResolvedValue({ ...baseCandidature });

      const updated = {
        ...baseCandidature,
        status: CandidatureStatus.CONFIRMED,
      };
      prisma.$transaction.mockImplementation(
        (fnOrArray: Array<unknown> | ((tx: unknown) => Promise<unknown>)) => {
          if (typeof fnOrArray === 'function') {
            const tx = {
              medecinHopital: { upsert: jest.fn() },
              candidature: { update: jest.fn().mockResolvedValue(updated) },
            };
            return fnOrArray(tx);
          }
          return updated;
        },
      );
      prisma.notification.create.mockResolvedValue({});

      const result = await service.accept(1);

      expect(result.data.status).toBe(CandidatureStatus.CONFIRMED);
      expect(result.message).toContain('succès');
    });

    it('should throw NotFoundException if not found', async () => {
      prisma.candidature.findUnique.mockResolvedValue(null);

      await expect(service.accept(999)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if not PENDING', async () => {
      prisma.candidature.findUnique.mockResolvedValue({
        ...baseCandidature,
        status: CandidatureStatus.CONFIRMED,
      });

      await expect(service.accept(1)).rejects.toThrow(BadRequestException);
    });
  });

  // ─── REJECT ──────────────────────────────────────────────────────────
  describe('reject', () => {
    const baseCandidature = {
      candidatureId: 1,
      medecinId: 1,
      hopitalId: 10,
      status: CandidatureStatus.PENDING,
      medecin: {
        userId: 1,
        firstName: 'Doc',
        lastName: 'Tor',
        expotoken: null,
      },
      hopital: {
        userId: 10,
        firstName: 'H1',
        hospitalName: 'HopA',
        city: 'Paris',
      },
    };

    it('should reject a PENDING candidature', async () => {
      prisma.candidature.findUnique.mockResolvedValue({ ...baseCandidature });
      prisma.candidature.delete.mockResolvedValue({});
      prisma.notification.create.mockResolvedValue({});

      const result = await service.reject(1);

      expect(prisma.candidature.delete).toHaveBeenCalledWith({
        where: { candidatureId: 1 },
      });
      expect(result.message).toContain('succès');
    });

    it('should throw NotFoundException if not found', async () => {
      prisma.candidature.findUnique.mockResolvedValue(null);

      await expect(service.reject(999)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if not PENDING', async () => {
      prisma.candidature.findUnique.mockResolvedValue({
        ...baseCandidature,
        status: CandidatureStatus.CONFIRMED,
      });

      await expect(service.reject(1)).rejects.toThrow(BadRequestException);
    });
  });
});

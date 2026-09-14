import { Test, TestingModule } from '@nestjs/testing';
import { OrdonancesService } from './ordonances.service';
import { PrismaService } from '../prisma/prisma.service';
import { SuivisService } from '../suivis/suivis.service';
import { BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';

jest.mock('src/utils/cloudinary', () => ({ uploadImageToCloudinary: jest.fn().mockResolvedValue('https://img.url') }));
jest.mock('src/utils/expo-push', () => ({ bi: (fr: string) => fr, isValidExpoToken: () => false, sendExpoPush: jest.fn() }));

describe('OrdonancesService', () => {
  let service: OrdonancesService;
  let prisma: Record<string, any>;
  let suivisService: Record<string, jest.Mock>;

  beforeEach(async () => {
    prisma = {
      ordonance: { findUnique: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn(), count: jest.fn() },
      user: { findUnique: jest.fn() },
      reservation: { findUnique: jest.fn() },
      notification: { create: jest.fn() },
      suivi: { deleteMany: jest.fn() },
      $transaction: jest.fn((fns: any[]) => Promise.all(fns)),
    };
    suivisService = { createFromTreatment: jest.fn(), removeByOrdonance: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdonancesService,
        { provide: PrismaService, useValue: prisma },
        { provide: SuivisService, useValue: suivisService },
      ],
    }).compile();

    service = module.get(OrdonancesService);
  });

  describe('findAll', () => {
    it('should return paginated ordonnances', async () => {
      prisma.$transaction.mockResolvedValue([[], 0]);
      const result = await service.findAll({});
      expect(result.meta.total).toBe(0);
    });
  });

  describe('findOne', () => {
    it('should throw if not found', async () => {
      prisma.ordonance.findUnique.mockResolvedValue(null);
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should throw if reservation already has ordonnance', async () => {
      prisma.ordonance.findFirst.mockResolvedValue({ ordonanceId: 1 });
      await expect(service.create({ reservationId: 1 } as any)).rejects.toThrow(ConflictException);
    });
    it('should throw if no treatments', async () => {
      prisma.ordonance.findFirst.mockResolvedValue(null);
      prisma.user.findUnique.mockResolvedValue({ userId: 1, firstName: 'Dr', lastName: 'X', expotoken: null });
      prisma.reservation.findUnique.mockResolvedValue({ reservationId: 1 });
      await expect(service.create({ reservationId: 1, medecinId: 1, patientId: 2, traitement: [] } as any)).rejects.toThrow(BadRequestException);
    });
  });

  describe('update', () => {
    it('should throw if not found', async () => {
      prisma.ordonance.findUnique.mockResolvedValue(null);
      await expect(service.update(999, {} as any)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should throw if not found', async () => {
      prisma.ordonance.findUnique.mockResolvedValue(null);
      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
    it('should delete ordonnance', async () => {
      prisma.ordonance.findUnique.mockResolvedValue({ ordonanceId: 1 });
      prisma.$transaction.mockResolvedValue(undefined);
      const result = await service.remove(1);
      expect(result.messageE).toContain('deleted');
    });
  });
});

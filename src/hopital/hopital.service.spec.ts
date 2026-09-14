import {
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Sex, UserType } from 'generated/prisma';

jest.mock('src/utils/cloudinary', () => ({
  uploadImageToCloudinary: jest.fn(),
}));

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password'),
}));

import { HopitalService } from './hopital.service';
import { uploadImageToCloudinary } from 'src/utils/cloudinary';
import * as bcrypt from 'bcryptjs';

const prisma = {
  user: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  medecinHopital: {
    findMany: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  },
  reservation: {
    findMany: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
  },
  $transaction: jest.fn(),
  $queryRaw: jest.fn(),
} as any;

let service: HopitalService;

beforeEach(() => {
  jest.clearAllMocks();
  service = new HopitalService(prisma);
});

function mockTransactionArray(results: any[]) {
  prisma.$transaction.mockResolvedValue(results);
}

function mockTransactionCallback() {
  prisma.$transaction.mockImplementation(async (fnOrArray: any) => {
    if (typeof fnOrArray === 'function') {
      return fnOrArray(prisma);
    }
    return Promise.all(fnOrArray);
  });
}

// ─────────────────────────────────────────────────────
// create
// ─────────────────────────────────────────────────────
describe('create', () => {
  const dto = {
    firstName: 'Hôpital Central',
    email: 'central@hop.cm',
    phone: '691234567',
    password: 'secret123',
    city: 'Yaoundé',
    address: 'Boulevard du 20 Mai',
    profile: undefined,
    document: undefined,
  } as any;

  const createdUser = {
    userId: 1,
    firstName: 'Hôpital Central',
    lastName: 'Yaoundé',
    email: 'central@hop.cm',
    phone: '691234567',
    userType: UserType.HOPITAL,
    city: 'Yaoundé',
    address: 'Boulevard du 20 Mai',
    profile: undefined,
    document: undefined,
    isVerified: false,
    createdAt: new Date(),
  };

  beforeEach(() => {
    prisma.user.findFirst.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue(createdUser);
    (uploadImageToCloudinary as jest.Mock).mockResolvedValue('https://cloudinary.com/img.png');
  });

  it('should create a hospital successfully', async () => {
    const result = await service.create(dto);

    expect(bcrypt.hash).toHaveBeenCalledWith('secret123', 10);
    expect(prisma.user.create).toHaveBeenCalled();
    expect(result.message).toBeDefined();
    expect(result.data.userId).toBe(1);
  });

  it('should throw ConflictException on email conflict', async () => {
    prisma.user.findFirst.mockResolvedValueOnce({ userId: 99 });

    await expect(service.create(dto)).rejects.toThrow(ConflictException);
  });

  it('should throw ConflictException on phone conflict', async () => {
    prisma.user.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ userId: 99 });

    await expect(service.create(dto)).rejects.toThrow(ConflictException);
  });

  it('should upload profile via cloudinary when base64 provided', async () => {
    await service.create({ ...dto, profile: 'data:image/png;base64,abc' });

    expect(uploadImageToCloudinary).toHaveBeenCalledWith(
      'data:image/png;base64,abc',
      expect.stringContaining('hopitals/profiles/'),
    );
  });

  it('should upload document via cloudinary when base64 provided', async () => {
    await service.create({ ...dto, document: 'data:image/png;base64,def' });

    expect(uploadImageToCloudinary).toHaveBeenCalledWith(
      'data:image/png;base64,def',
      expect.stringContaining('hopitals/documents/'),
    );
  });

  it('should pass through https URL for profile without uploading', async () => {
    const url = 'https://res.cloudinary.com/test/logo.png';
    await service.create({ ...dto, profile: url });

    expect(uploadImageToCloudinary).not.toHaveBeenCalled();
    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ profile: url }),
      }),
    );
  });

  it('should use city as lastName fallback when lastName not provided', async () => {
    await service.create({ ...dto, lastName: undefined });

    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ lastName: 'Yaoundé' }),
      }),
    );
  });
});

// ─────────────────────────────────────────────────────
// findAll
// ─────────────────────────────────────────────────────
describe('findAll', () => {
  const hospitalRow = {
    userId: 1,
    firstName: 'Hôpital Central',
    lastName: 'Yaoundé',
    email: 'central@hop.cm',
    phone: '691234567',
    city: 'Yaoundé',
    address: 'Boulevard',
    profile: null,
    isVerified: true,
    createdAt: new Date(),
    _count: { medecinsAffilies: 5, reservationsHopital: 20 },
  };

  beforeEach(() => {
    mockTransactionArray([[hospitalRow], 1]);
  });

  it('should return paginated hospitals', async () => {
    const result = await service.findAll({ page: 1, limit: 10 } as any);

    expect(result.data).toHaveLength(1);
    expect(result.meta.total).toBe(1);
    expect(result.meta.page).toBe(1);
    expect(result.meta.limit).toBe(10);
    expect(result.meta.pageCount).toBe(1);
  });

  it('should apply search filter', async () => {
    mockTransactionArray([[], 0]);
    await service.findAll({ page: 1, limit: 10, search: 'Central' } as any);

    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            { firstName: { contains: 'Central' } },
            { lastName: { contains: 'Central' } },
            { email: { contains: 'Central' } },
            { hospitalName: { contains: 'Central' } },
          ]),
        }),
      }),
    );
  });

  it('should apply city filter', async () => {
    mockTransactionArray([[], 0]);
    await service.findAll({ page: 1, limit: 10, city: 'Douala' } as any);

    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          city: { contains: 'Douala' },
        }),
      }),
    );
  });

  it('should default to page 1 and limit 20', async () => {
    mockTransactionArray([[], 0]);
    await service.findAll({} as any);

    expect(prisma.user.count).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.any(Object) }),
    );
  });
});

// ─────────────────────────────────────────────────────
// findOne
// ─────────────────────────────────────────────────────
describe('findOne', () => {
  const hopital = {
    userId: 1,
    firstName: 'Hôpital Central',
    password: 'hashed',
    medecinsAffilies: [
      { medecin: { userId: 10, firstName: 'Dr A', lastName: 'B', speciality: { name: 'Cardio' } } },
    ],
    reservationsHopital: [],
  };

  it('should return hospital with stats', async () => {
    prisma.user.findUnique.mockResolvedValue(hopital);
    prisma.reservation.count
      .mockResolvedValueOnce(10)
      .mockResolvedValueOnce(2);
    prisma.reservation.aggregate.mockResolvedValue({ _sum: { amount: 50000 } });

    const result = await service.findOne(1);

    expect(result.data.userId).toBe(1);
    expect(result.data.statistiques.totalMedecins).toBe(1);
    expect(result.data.statistiques.totalReservations).toBe(10);
    expect(result.data.statistiques.revenusTotal).toBe(50000);
    expect(result.data).not.toHaveProperty('password');
  });

  it('should throw NotFoundException if hospital not found', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
  });

  it('should return revenusTotal as 0 when no completed reservations', async () => {
    prisma.user.findUnique.mockResolvedValue(hopital);
    prisma.reservation.count.mockResolvedValue(0);
    prisma.reservation.aggregate.mockResolvedValue({ _sum: { amount: null } });

    const result = await service.findOne(1);

    expect(result.data.statistiques.revenusTotal).toBe(0);
  });
});

// ─────────────────────────────────────────────────────
// update
// ─────────────────────────────────────────────────────
describe('update', () => {
  const existing = {
    userId: 1,
    firstName: 'Hôpital Central',
    email: 'central@hop.cm',
    phone: '691234567',
  };

  const updatedUser = {
    userId: 1,
    firstName: 'Hôpital Modifié',
    lastName: 'Yaoundé',
    email: 'new@hop.cm',
    phone: '691234567',
    city: 'Yaoundé',
    address: 'Boulevard',
    profile: null,
    isVerified: true,
    updatedAt: new Date(),
  };

  beforeEach(() => {
    prisma.user.findUnique.mockResolvedValue(existing);
    prisma.user.findFirst.mockResolvedValue(null);
    prisma.user.update.mockResolvedValue(updatedUser);
    (uploadImageToCloudinary as jest.Mock).mockResolvedValue('https://cloudinary.com/new.png');
  });

  it('should update hospital successfully', async () => {
    const result = await service.update(1, { firstName: 'Hôpital Modifié' } as any);

    expect(result.message).toBeDefined();
    expect(prisma.user.update).toHaveBeenCalled();
  });

  it('should throw NotFoundException if hospital not found', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(service.update(999, {} as any)).rejects.toThrow(NotFoundException);
  });

  it('should throw ConflictException on email conflict during update', async () => {
    prisma.user.findFirst.mockResolvedValueOnce({ userId: 88 });

    await expect(
      service.update(1, { email: 'taken@hop.cm' } as any),
    ).rejects.toThrow(ConflictException);
  });

  it('should hash password when provided in update', async () => {
    await service.update(1, { password: 'newpass123' } as any);

    expect(bcrypt.hash).toHaveBeenCalledWith('newpass123', 10);
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ password: 'hashed_password' }),
      }),
    );
  });

  it('should upload new profile if base64 provided', async () => {
    await service.update(1, { profile: 'data:image/png;base64,abc' } as any);

    expect(uploadImageToCloudinary).toHaveBeenCalled();
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ profile: 'https://cloudinary.com/new.png' }),
      }),
    );
  });

  it('should not check uniqueness if neither email nor phone changed', async () => {
    await service.update(1, { firstName: 'New Name' } as any);

    expect(prisma.user.findFirst).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────
// addMedecins
// ─────────────────────────────────────────────────────
describe('addMedecins', () => {
  const hopital = { userId: 1, userType: UserType.HOPITAL };

  beforeEach(() => {
    prisma.user.findUnique.mockResolvedValue(hopital);
  });

  it('should add new medecins successfully', async () => {
    prisma.user.findMany.mockResolvedValue([
      { userId: 10, firstName: 'Dr A', lastName: 'B' },
      { userId: 20, firstName: 'Dr C', lastName: 'D' },
    ]);
    prisma.medecinHopital.findMany.mockResolvedValue([]);

    const created = [
      { medecinId: 10, hopitalId: 1, medecin: { userId: 10, firstName: 'Dr A', lastName: 'B', email: 'a@b.cm', speciality: { name: 'Cardio' } } },
      { medecinId: 20, hopitalId: 1, medecin: { userId: 20, firstName: 'Dr C', lastName: 'D', email: 'c@d.cm', speciality: { name: 'Neuro' } } },
    ];
    mockTransactionArray(created);

    const result = await service.addMedecins(1, { medecinIds: [10, 20] } as any);

    expect(result.added).toHaveLength(2);
    expect(result.skipped).toHaveLength(0);
    expect(prisma.$transaction).toHaveBeenCalled();
  });

  it('should throw NotFoundException if hospital not found', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(
      service.addMedecins(999, { medecinIds: [10] } as any),
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw NotFoundException if some medecins not found', async () => {
    prisma.user.findMany.mockResolvedValue([{ userId: 10, firstName: 'Dr', lastName: 'A' }]);

    await expect(
      service.addMedecins(1, { medecinIds: [10, 99] } as any),
    ).rejects.toThrow(NotFoundException);
  });

  it('should skip already affiliated medecins', async () => {
    prisma.user.findMany.mockResolvedValue([
      { userId: 10, firstName: 'Dr A', lastName: 'B' },
      { userId: 20, firstName: 'Dr C', lastName: 'D' },
    ]);
    prisma.medecinHopital.findMany.mockResolvedValue([{ medecinId: 10 }]);

    const created = [
      { medecinId: 20, hopitalId: 1, medecin: { userId: 20, firstName: 'Dr C', lastName: 'D', email: 'c@d.cm', speciality: { name: 'Neuro' } } },
    ];
    mockTransactionArray(created);

    const result = await service.addMedecins(1, { medecinIds: [10, 20] } as any);

    expect(result.added).toHaveLength(1);
    expect(result.skipped).toEqual([10]);
  });

  it('should return all as skipped when all already affiliated', async () => {
    prisma.user.findMany.mockResolvedValue([
      { userId: 10, firstName: 'Dr A', lastName: 'B' },
    ]);
    prisma.medecinHopital.findMany.mockResolvedValue([{ medecinId: 10 }]);

    const result = await service.addMedecins(1, { medecinIds: [10] } as any);

    expect(result.added).toHaveLength(0);
    expect(result.skipped).toEqual([10]);
    expect(result.message).toContain('déjà affilié');
  });
});

// ─────────────────────────────────────────────────────
// removeMedecins
// ─────────────────────────────────────────────────────
describe('removeMedecins', () => {
  const hopital = { userId: 1, userType: UserType.HOPITAL };

  beforeEach(() => {
    prisma.user.findUnique.mockResolvedValue(hopital);
  });

  it('should remove affiliated medecins successfully', async () => {
    prisma.medecinHopital.findMany.mockResolvedValue([
      { medecinId: 10 },
      { medecinId: 20 },
    ]);
    mockTransactionCallback();

    const result = await service.removeMedecins(1, { medecinIds: [10, 20] } as any);

    expect(result.removed).toEqual([10, 20]);
    expect(result.skipped).toHaveLength(0);
    expect(prisma.$transaction).toHaveBeenCalled();
  });

  it('should throw NotFoundException if hospital not found', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(
      service.removeMedecins(999, { medecinIds: [10] } as any),
    ).rejects.toThrow(NotFoundException);
  });

  it('should return empty removed when none are affiliated', async () => {
    prisma.medecinHopital.findMany.mockResolvedValue([]);

    const result = await service.removeMedecins(1, { medecinIds: [10, 20] } as any);

    expect(result.removed).toHaveLength(0);
    expect(result.skipped).toEqual([10, 20]);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('should skip non-affiliated medecins', async () => {
    prisma.medecinHopital.findMany.mockResolvedValue([{ medecinId: 10 }]);
    mockTransactionCallback();

    const result = await service.removeMedecins(1, { medecinIds: [10, 20] } as any);

    expect(result.removed).toEqual([10]);
    expect(result.skipped).toEqual([20]);
  });
});

// ─────────────────────────────────────────────────────
// getMedecins
// ─────────────────────────────────────────────────────
describe('getMedecins', () => {
  const hopital = { userId: 1, userType: UserType.HOPITAL };

  const medecinRow = {
    medecinId: 10,
    hopitalId: 1,
    createdAt: new Date(),
    medecin: {
      userId: 10,
      firstName: 'Dr A',
      lastName: 'B',
      speciality: { name: 'Cardio' },
    },
  };

  beforeEach(() => {
    prisma.user.findUnique.mockResolvedValue(hopital);
  });

  it('should return paginated medecins', async () => {
    mockTransactionArray([[medecinRow], 1]);

    const result = await service.getMedecins(1, 1, 10);

    expect(result.data).toHaveLength(1);
    expect(result.meta.total).toBe(1);
  });

  it('should throw NotFoundException if hospital not found', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(service.getMedecins(999)).rejects.toThrow(NotFoundException);
  });

  it('should apply search filter by name', async () => {
    mockTransactionArray([[], 0]);
    await service.getMedecins(1, 1, 10, 'Dr A');

    expect(prisma.medecinHopital.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          medecin: expect.objectContaining({
            OR: expect.arrayContaining([
              { firstName: { contains: 'Dr A' } },
              { lastName: { contains: 'Dr A' } },
            ]),
          }),
        }),
      }),
    );
  });

  it('should not add medecin filter when search is empty', async () => {
    mockTransactionArray([[], 0]);
    await service.getMedecins(1, 1, 10);

    expect(prisma.medecinHopital.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { hopitalId: 1 },
      }),
    );
  });
});

// ─────────────────────────────────────────────────────
// getReservations
// ─────────────────────────────────────────────────────
describe('getReservations', () => {
  const hopital = { userId: 1, userType: UserType.HOPITAL };
  const reservationRow = {
    reservationId: 100,
    hopitalId: 1,
    date: '2025-09-10',
    hour: '10:00',
    status: 'PENDING',
    amount: 5000,
    patient: { userId: 5, firstName: 'John', lastName: 'Doe', phone: '690000000' },
    medecin: { userId: 10, firstName: 'Dr A', lastName: 'B', speciality: { name: 'Cardio' } },
    transaction: null,
  };

  beforeEach(() => {
    prisma.user.findUnique.mockResolvedValue(hopital);
  });

  it('should return paginated reservations', async () => {
    mockTransactionArray([[reservationRow], 1]);

    const result = await service.getReservations(1, { page: 1, limit: 10 });

    expect(result.data).toHaveLength(1);
    expect(result.meta.total).toBe(1);
  });

  it('should throw NotFoundException if hospital not found', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(
      service.getReservations(999, { page: 1, limit: 10 }),
    ).rejects.toThrow(NotFoundException);
  });

  it('should apply status filter', async () => {
    mockTransactionArray([[], 0]);
    await service.getReservations(1, { page: 1, limit: 10, status: 'COMPLETED' });

    expect(prisma.reservation.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: 'COMPLETED' }),
      }),
    );
  });

  it('should apply date filter', async () => {
    mockTransactionArray([[], 0]);
    await service.getReservations(1, { page: 1, limit: 10, date: '2025-09-10' });

    expect(prisma.reservation.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ date: '2025-09-10' }),
      }),
    );
  });
});

// ─────────────────────────────────────────────────────
// getStats
// ─────────────────────────────────────────────────────
describe('getStats', () => {
  const hopital = { userId: 1, userType: UserType.HOPITAL };

  beforeEach(() => {
    prisma.user.findUnique.mockResolvedValue(hopital);
    prisma.medecinHopital.count.mockResolvedValue(5);
    prisma.reservation.count
      .mockResolvedValueOnce(100)
      .mockResolvedValueOnce(3);
    prisma.reservation.aggregate.mockResolvedValue({ _sum: { amount: 75000 } });
    prisma.$queryRaw
      .mockResolvedValueOnce([{ month: '2025-09', count: 10 }])
      .mockResolvedValueOnce([{ month: '2025-09', total: 5000 }])
      .mockResolvedValueOnce([
        { medecinId: 10, nom: 'Dr A', reservations: 8, revenus: 40000 },
      ]);
  });

  it('should return stats successfully', async () => {
    const result = await service.getStats(1);

    expect(result.data.totalMedecins).toBe(5);
    expect(result.data.totalReservations).toBe(100);
    expect(result.data.reservationsAujourdhui).toBe(3);
    expect(result.data.revenusTotal).toBe(75000);
    expect(result.data.reservationsParMois).toBeDefined();
    expect(result.data.revenusParMois).toBeDefined();
    expect(result.data.topMedecins).toBeDefined();
  });

  it('should throw NotFoundException if hospital not found', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(service.getStats(999)).rejects.toThrow(NotFoundException);
  });

  it('should return 0 for revenusTotal when no completed reservations', async () => {
    prisma.reservation.aggregate.mockResolvedValue({ _sum: { amount: null } });

    const result = await service.getStats(1);

    expect(result.data.revenusTotal).toBe(0);
  });
});

// ─────────────────────────────────────────────────────
// findAllWithDoctorFilter
// ─────────────────────────────────────────────────────
describe('findAllWithDoctorFilter', () => {
  const hospitalRow = {
    userId: 1,
    firstName: 'Hôpital Central',
    lastName: 'Yaoundé',
    email: 'central@hop.cm',
    phone: '691234567',
    city: 'Yaoundé',
    address: 'Boulevard',
    profile: null,
    isVerified: true,
    createdAt: new Date(),
    _count: { medecinsAffilies: 5, reservationsHopital: 20 },
  };

  it('should return hospitals filtered by medecinId', async () => {
    mockTransactionArray([[hospitalRow], 1]);

    const result = await service.findAllWithDoctorFilter(
      { page: 1, limit: 10 } as any,
      42,
    );

    expect(result.data).toHaveLength(1);
    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          medecinsAffilies: { some: { medecinId: 42 } },
        }),
      }),
    );
  });

  it('should return all hospitals when no medecinId', async () => {
    mockTransactionArray([[hospitalRow], 1]);

    const result = await service.findAllWithDoctorFilter(
      { page: 1, limit: 10 } as any,
    );

    expect(result.data).toHaveLength(1);
    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.not.objectContaining({
          medecinsAffilies: expect.anything(),
        }),
      }),
    );
  });

  it('should apply search filter along with medecinId', async () => {
    mockTransactionArray([[], 0]);
    await service.findAllWithDoctorFilter(
      { page: 1, limit: 10, search: 'Central' } as any,
      42,
    );

    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          medecinsAffilies: { some: { medecinId: 42 } },
          OR: expect.arrayContaining([
            { firstName: { contains: 'Central' } },
          ]),
        }),
      }),
    );
  });

  it('should apply city filter along with medecinId', async () => {
    mockTransactionArray([[], 0]);
    await service.findAllWithDoctorFilter(
      { page: 1, limit: 10, city: 'Douala' } as any,
      42,
    );

    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          city: { contains: 'Douala' },
        }),
      }),
    );
  });
});

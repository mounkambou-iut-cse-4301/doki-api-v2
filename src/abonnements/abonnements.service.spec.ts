import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import {
  AbonnementStatus,
  TransactionStatus,
  TransactionType,
  UserType,
} from 'generated/prisma';

jest.mock('src/utils/expo-push', () => ({
  bi: jest.fn((_fr: string, en: string) => en),
  isValidExpoToken: jest.fn(() => false),
  sendExpoPush: jest.fn(),
}));

import { AbonnementsService } from './abonnements.service';

const prisma = {
  user: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
  },
  groupePackage: {
    findUnique: jest.fn(),
  },
  abonnement: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
  transaction: {
    create: jest.fn(),
    update: jest.fn(),
  },
  notification: {
    create: jest.fn(),
  },
  reservation: {
    count: jest.fn(),
  },
  $transaction: jest.fn(),
  $queryRaw: jest.fn(),
} as any;

let service: AbonnementsService;

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  service = new AbonnementsService(prisma);
});

afterEach(() => {
  jest.useRealTimers();
});

function mockTransactionCallback() {
  prisma.$transaction.mockImplementation(async (fnOrArray: any) => {
    if (typeof fnOrArray === 'function') {
      return fnOrArray(prisma);
    }
    return Promise.all(fnOrArray);
  });
}

function mockTransactionArray(results: any[]) {
  prisma.$transaction.mockResolvedValue(results);
}

// ─────────────────────────────────────────────────────
// subscribeToPackage
// ─────────────────────────────────────────────────────
describe('subscribeToPackage', () => {
  const dto = { patientId: 1, packageId: 10 } as any;
  const patient = { userId: 1, userType: UserType.PATIENT };
  const pkg = {
    packageId: 10,
    specialityId: 5,
    nom: 'Cardio Basic',
    prix: 5000,
    dureeValiditeJours: 30,
    nombreConsultations: 4,
    isActive: true,
    speciality: { name: 'Cardiologie' },
  };
  const medecins = [
    { userId: 100, firstName: 'Dr', lastName: 'A', expotoken: null },
  ];

  beforeEach(() => {
    prisma.user.findUnique.mockResolvedValue(patient);
    prisma.groupePackage.findUnique.mockResolvedValue(pkg);
    prisma.user.findMany.mockResolvedValue(medecins);
    prisma.notification.create.mockResolvedValue({});
    mockTransactionCallback();

    prisma.$queryRaw.mockResolvedValue([{ isLocked: 1 }]);
    prisma.abonnement.findMany.mockResolvedValue([]);
    prisma.transaction.create.mockResolvedValue({ transactionId: 999 });
    prisma.abonnement.create.mockResolvedValue({
      abonnementId: 1,
      transactionId: 999,
      patientId: 1,
      packageId: 10,
      status: AbonnementStatus.PENDING,
      amount: 5000,
      numberOfTimePlanReservation: 4,
      remainingReservations: 4,
      debutDate: new Date(),
      endDate: new Date(),
      package: pkg,
    });
  });

  it('should throw NotFoundException if patient not found', async () => {
    prisma.user.findUnique.mockResolvedValueOnce(null);
    await expect(service.subscribeToPackage(dto)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should throw NotFoundException if patient is not PATIENT type', async () => {
    prisma.user.findUnique.mockResolvedValueOnce({
      userId: 1,
      userType: UserType.MEDECIN,
    });
    await expect(service.subscribeToPackage(dto)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should throw NotFoundException if package not found', async () => {
    prisma.groupePackage.findUnique.mockResolvedValueOnce(null);
    await expect(service.subscribeToPackage(dto)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should throw BadRequestException if package is not active', async () => {
    prisma.groupePackage.findUnique.mockResolvedValueOnce({
      ...pkg,
      isActive: false,
    });
    await expect(service.subscribeToPackage(dto)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should throw ConflictException if GET_LOCK fails', async () => {
    prisma.$queryRaw.mockResolvedValueOnce([{ isLocked: 0 }]);
    await expect(service.subscribeToPackage(dto)).rejects.toThrow(
      ConflictException,
    );
  });

  it('should throw ConflictException if a pending subscription exists', async () => {
    prisma.$queryRaw.mockResolvedValueOnce([{ isLocked: 1 }]);
    prisma.abonnement.findMany.mockResolvedValueOnce([
      {
        abonnementId: 50,
        status: AbonnementStatus.PENDING,
        numberOfTimePlanReservation: 4,
        _count: { reservations: 0 },
      },
    ]);

    await expect(service.subscribeToPackage(dto)).rejects.toThrow(
      ConflictException,
    );
  });

  it('should throw ConflictException if an active subscription with remaining consultations exists', async () => {
    prisma.$queryRaw.mockResolvedValueOnce([{ isLocked: 1 }]);
    prisma.abonnement.findMany.mockResolvedValueOnce([
      {
        abonnementId: 51,
        status: AbonnementStatus.CONFIRMED,
        numberOfTimePlanReservation: 4,
        _count: { reservations: 1 },
      },
    ]);

    await expect(service.subscribeToPackage(dto)).rejects.toThrow(
      ConflictException,
    );
  });

  it('should allow subscription if existing confirmed subscription is fully used', async () => {
    prisma.$queryRaw.mockResolvedValueOnce([{ isLocked: 1 }]);
    prisma.abonnement.findMany.mockResolvedValueOnce([
      {
        abonnementId: 52,
        status: AbonnementStatus.CONFIRMED,
        numberOfTimePlanReservation: 2,
        _count: { reservations: 2 },
      },
    ]);

    mockTransactionCallback();
    const result = await service.subscribeToPackage(dto);
    expect(result.message).toBeDefined();
    expect(prisma.transaction.create).toHaveBeenCalled();
    expect(prisma.abonnement.create).toHaveBeenCalled();
  });

  it('should create abonnement on valid input', async () => {
    mockTransactionCallback();
    const result = await service.subscribeToPackage(dto);

    expect(result.message).toBeDefined();
    expect(result.abonnement).toBeDefined();
    expect(prisma.transaction.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          amount: 5000,
          type: TransactionType.ABONNEMENT,
          status: TransactionStatus.PENDING,
        }),
      }),
    );
    expect(prisma.abonnement.create).toHaveBeenCalled();
  });

  it('should create patient notification', async () => {
    mockTransactionCallback();
    await service.subscribeToPackage(dto);

    expect(prisma.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 1,
        }),
      }),
    );
  });

  it('should fire expo push when doctor has valid token', async () => {
    const { isValidExpoToken, sendExpoPush } = require('src/utils/expo-push');
    (isValidExpoToken as jest.Mock).mockReturnValueOnce(true);
    prisma.user.findMany.mockResolvedValueOnce([
      {
        userId: 100,
        firstName: 'Dr',
        lastName: 'A',
        expotoken: 'ExpoToken123',
      },
    ]);

    mockTransactionCallback();
    await service.subscribeToPackage(dto);

    expect(sendExpoPush).toHaveBeenCalled();
  });

  it('should schedule setTimeout for deferred confirmation', async () => {
    mockTransactionCallback();
    await service.subscribeToPackage(dto);

    prisma.abonnement.update.mockResolvedValue({});
    prisma.transaction.update.mockResolvedValue({});

    jest.advanceTimersByTime(10_000);
    await Promise.resolve();

    expect(prisma.abonnement.update).toHaveBeenCalled();
    expect(prisma.transaction.update).toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────
// getActiveSubscriptions
// ─────────────────────────────────────────────────────
describe('getActiveSubscriptions', () => {
  const patient = { userId: 1, userType: UserType.PATIENT };
  const aboRow = {
    abonnementId: 1,
    patientId: 1,
    status: AbonnementStatus.CONFIRMED,
    numberOfTimePlanReservation: 4,
    remainingReservations: 4,
    _count: { reservations: 2 },
    package: { speciality: { name: 'Cardio' } },
  };

  beforeEach(() => {
    prisma.user.findUnique.mockResolvedValue(patient);
    prisma.abonnement.findMany.mockResolvedValue([aboRow]);
    prisma.abonnement.count.mockResolvedValue(1);
  });

  it('should throw BadRequestException if userId is missing or 0', async () => {
    await expect(service.getActiveSubscriptions(0)).rejects.toThrow(
      BadRequestException,
    );
    await expect(service.getActiveSubscriptions(null as any)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should throw NotFoundException if user not found', async () => {
    prisma.user.findUnique.mockResolvedValueOnce(null);
    await expect(service.getActiveSubscriptions(1)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should throw ForbiddenException if user is not PATIENT', async () => {
    prisma.user.findUnique.mockResolvedValueOnce({
      userId: 1,
      userType: UserType.MEDECIN,
    });
    await expect(service.getActiveSubscriptions(1)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('should return paginated active subscriptions with usage', async () => {
    mockTransactionArray([[aboRow], 1]);
    const result = await service.getActiveSubscriptions(1, 1, 10);

    expect(result.data).toHaveLength(1);
    expect(result.data[0].consultationsUtilisees).toBe(2);
    expect(result.data[0].consultationsRestantes).toBe(4);
    expect(result.meta.total).toBe(1);
    expect(result.meta.pageCount).toBe(1);
  });

  it('should use remainingReservations from row when present', async () => {
    const aboRowLow = { ...aboRow, remainingReservations: 1 };
    mockTransactionArray([[aboRowLow], 1]);
    const result = await service.getActiveSubscriptions(1);
    expect(result.data[0].consultationsRestantes).toBe(1);
  });

  it('should mark quotaEpuise when remaining is 0', async () => {
    const aboRowUsed = {
      ...aboRow,
      numberOfTimePlanReservation: 2,
      remainingReservations: 0,
      _count: { reservations: 2 },
    };
    mockTransactionArray([[aboRowUsed], 1]);
    const result = await service.getActiveSubscriptions(1);
    expect(result.data[0].quotaEpuise).toBe(true);
  });
});

// ─────────────────────────────────────────────────────
// getSubscriptionHistory
// ─────────────────────────────────────────────────────
describe('getSubscriptionHistory', () => {
  const patient = { userId: 1, userType: UserType.PATIENT };
  const aboRow = {
    abonnementId: 1,
    patientId: 1,
    status: AbonnementStatus.CONFIRMED,
    numberOfTimePlanReservation: 4,
    remainingReservations: 3,
    _count: { reservations: 1 },
    package: { speciality: { name: 'Cardio' } },
    transaction: { transactionId: 10 },
  };

  beforeEach(() => {
    prisma.user.findUnique.mockResolvedValue(patient);
    prisma.abonnement.findMany.mockResolvedValue([aboRow]);
    prisma.abonnement.count.mockResolvedValue(1);
  });

  it('should throw BadRequestException if userId is invalid', async () => {
    await expect(
      service.getSubscriptionHistory(0, { page: 1, limit: 10 } as any),
    ).rejects.toThrow(BadRequestException);
  });

  it('should throw NotFoundException if user not found', async () => {
    prisma.user.findUnique.mockResolvedValueOnce(null);
    await expect(
      service.getSubscriptionHistory(1, { page: 1, limit: 10 } as any),
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw ForbiddenException if user is not PATIENT', async () => {
    prisma.user.findUnique.mockResolvedValueOnce({
      userId: 1,
      userType: UserType.MEDECIN,
    });
    await expect(
      service.getSubscriptionHistory(1, { page: 1, limit: 10 } as any),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should return paginated history with usage', async () => {
    mockTransactionArray([[aboRow], 1]);
    const result = await service.getSubscriptionHistory(1, {
      page: 1,
      limit: 10,
    } as any);

    expect(result.data).toHaveLength(1);
    expect(result.data[0].consultationsUtilisees).toBe(1);
    expect(result.data[0].consultationsRestantes).toBe(3);
    expect(result.data[0].quotaEpuise).toBe(false);
    expect(result.meta.total).toBe(1);
  });

  it('should apply status filter when provided', async () => {
    mockTransactionArray([[], 0]);
    await service.getSubscriptionHistory(1, {
      page: 1,
      limit: 10,
      status: AbonnementStatus.CONFIRMED,
    } as any);

    expect(prisma.abonnement.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: AbonnementStatus.CONFIRMED,
        }),
      }),
    );
  });

  it('should apply packageId filter', async () => {
    mockTransactionArray([[], 0]);
    await service.getSubscriptionHistory(1, {
      page: 1,
      limit: 10,
      packageId: 42,
    } as any);

    expect(prisma.abonnement.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ packageId: 42 }),
      }),
    );
  });

  it('should apply specialityId filter', async () => {
    mockTransactionArray([[], 0]);
    await service.getSubscriptionHistory(1, {
      page: 1,
      limit: 10,
      specialityId: 5,
    } as any);

    expect(prisma.abonnement.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          package: { specialityId: 5 },
        }),
      }),
    );
  });

  it('should apply q filter', async () => {
    mockTransactionArray([[], 0]);
    await service.getSubscriptionHistory(1, {
      page: 1,
      limit: 10,
      q: 'Cardio',
    } as any);

    expect(prisma.abonnement.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: [{ package: { nom: { contains: 'Cardio' } } }],
        }),
      }),
    );
  });
});

// ─────────────────────────────────────────────────────
// getSubscriptionsBySpeciality
// ─────────────────────────────────────────────────────
describe('getSubscriptionsBySpeciality', () => {
  const medecin = {
    userId: 10,
    userType: UserType.MEDECIN,
    specialityId: 5,
    speciality: { specialityId: 5, name: 'Cardio' },
  };
  const aboRow = {
    abonnementId: 1,
    patientId: 1,
    numberOfTimePlanReservation: 4,
    remainingReservations: 2,
    _count: { reservations: 2 },
    patient: { userId: 1, firstName: 'John', lastName: 'Doe' },
    package: { speciality: { name: 'Cardio' } },
    transaction: { transactionId: 10 },
  };

  beforeEach(() => {
    prisma.user.findUnique.mockResolvedValue(medecin);
    prisma.abonnement.findMany.mockResolvedValue([aboRow]);
    prisma.abonnement.count.mockResolvedValue(1);
    prisma.reservation.count.mockResolvedValue(1);
  });

  it('should throw BadRequestException if userId is invalid', async () => {
    await expect(
      service.getSubscriptionsBySpeciality(0, { page: 1, limit: 10 } as any),
    ).rejects.toThrow(BadRequestException);
  });

  it('should throw NotFoundException if doctor not found', async () => {
    prisma.user.findUnique.mockResolvedValueOnce(null);
    await expect(
      service.getSubscriptionsBySpeciality(10, { page: 1, limit: 10 } as any),
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw NotFoundException if user is not MEDECIN', async () => {
    prisma.user.findUnique.mockResolvedValueOnce({
      userId: 10,
      userType: UserType.PATIENT,
    });
    await expect(
      service.getSubscriptionsBySpeciality(10, { page: 1, limit: 10 } as any),
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw BadRequestException if doctor has no speciality', async () => {
    prisma.user.findUnique.mockResolvedValueOnce({
      ...medecin,
      speciality: null,
      specialityId: null,
    });
    await expect(
      service.getSubscriptionsBySpeciality(10, { page: 1, limit: 10 } as any),
    ).rejects.toThrow(BadRequestException);
  });

  it('should return paginated subscriptions with usage data', async () => {
    mockTransactionArray([[aboRow], 1]);
    const result = await service.getSubscriptionsBySpeciality(10, {
      page: 1,
      limit: 10,
    } as any);

    expect(result.data).toHaveLength(1);
    expect(result.data[0].consultationsUtiliseesAvecMoi).toBe(1);
    expect(result.data[0].consultationsRestantes).toBe(2);
    expect(result.meta.total).toBe(1);
  });

  it('should apply active filter', async () => {
    mockTransactionArray([[], 0]);
    await service.getSubscriptionsBySpeciality(10, {
      page: 1,
      limit: 10,
      active: true,
    } as any);

    expect(prisma.abonnement.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          endDate: expect.objectContaining({ gte: expect.any(Date) }),
          status: AbonnementStatus.CONFIRMED,
        }),
      }),
    );
  });

  it('should apply patientId filter', async () => {
    mockTransactionArray([[], 0]);
    await service.getSubscriptionsBySpeciality(10, {
      page: 1,
      limit: 10,
      patientId: 42,
    } as any);

    expect(prisma.abonnement.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ patientId: 42 }),
      }),
    );
  });
});

// ─────────────────────────────────────────────────────
// findOne
// ─────────────────────────────────────────────────────
describe('findOne', () => {
  it('should throw NotFoundException if not found', async () => {
    prisma.abonnement.findUnique.mockResolvedValue(null);
    await expect(service.findOne(1)).rejects.toThrow(NotFoundException);
  });

  it('should return abonnement with usage data', async () => {
    const abo = {
      abonnementId: 1,
      numberOfTimePlanReservation: 4,
      remainingReservations: 2,
      _count: { reservations: 2 },
      patient: { userId: 1 },
      package: { speciality: { name: 'Cardio' } },
      transaction: { transactionId: 10 },
    };
    prisma.abonnement.findUnique.mockResolvedValue(abo);

    const result = await service.findOne(1);
    expect(result.data).toBeDefined();
    expect(result.data.consultationsUtilisees).toBe(2);
    expect(result.data.consultationsRestantes).toBe(2);
    expect(result.data.quotaEpuise).toBe(false);
  });

  it('should mark quotaEpuise when no consultations remaining', async () => {
    const abo = {
      abonnementId: 1,
      numberOfTimePlanReservation: 2,
      remainingReservations: 0,
      _count: { reservations: 2 },
      patient: { userId: 1 },
      package: { speciality: { name: 'Cardio' } },
      transaction: { transactionId: 10 },
    };
    prisma.abonnement.findUnique.mockResolvedValue(abo);

    const result = await service.findOne(1);
    expect(result.data.quotaEpuise).toBe(true);
    expect(result.data.consultationsRestantes).toBe(0);
  });
});

// ─────────────────────────────────────────────────────
// findAll
// ─────────────────────────────────────────────────────
describe('findAll', () => {
  const aboRow = {
    abonnementId: 1,
    patientId: 1,
    numberOfTimePlanReservation: 4,
    remainingReservations: 3,
    _count: { reservations: 1 },
    patient: { userId: 1, firstName: 'John', profile: null },
    package: { speciality: { name: 'Cardio' } },
    transaction: { transactionId: 10 },
  };

  beforeEach(() => {
    prisma.abonnement.findMany.mockResolvedValue([aboRow]);
    prisma.abonnement.count.mockResolvedValue(1);
  });

  it('should return paginated abonnements', async () => {
    mockTransactionArray([[aboRow], 1]);
    const result = await service.findAll({ page: 1, limit: 10 } as any);

    expect(result.data).toHaveLength(1);
    expect(result.meta.total).toBe(1);
    expect(result.meta.page).toBe(1);
  });

  it('should apply patientId filter', async () => {
    mockTransactionArray([[], 0]);
    await service.findAll({ page: 1, limit: 10, patientId: 42 } as any);

    expect(prisma.abonnement.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ patientId: 42 }),
      }),
    );
  });

  it('should apply packageId filter', async () => {
    mockTransactionArray([[], 0]);
    await service.findAll({ page: 1, limit: 10, packageId: 7 } as any);

    expect(prisma.abonnement.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ packageId: 7 }),
      }),
    );
  });

  it('should apply specialityId filter', async () => {
    mockTransactionArray([[], 0]);
    await service.findAll({ page: 1, limit: 10, specialityId: 5 } as any);

    expect(prisma.abonnement.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          package: { specialityId: 5 },
        }),
      }),
    );
  });

  it('should apply status filter', async () => {
    mockTransactionArray([[], 0]);
    await service.findAll({
      page: 1,
      limit: 10,
      status: AbonnementStatus.CONFIRMED,
    } as any);

    expect(prisma.abonnement.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: AbonnementStatus.CONFIRMED,
        }),
      }),
    );
  });

  it('should apply active filter', async () => {
    mockTransactionArray([[], 0]);
    await service.findAll({ page: 1, limit: 10, active: true } as any);

    expect(prisma.abonnement.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          endDate: expect.objectContaining({ gte: expect.any(Date) }),
          status: AbonnementStatus.CONFIRMED,
        }),
      }),
    );
  });

  it('should apply q search filter', async () => {
    mockTransactionArray([[], 0]);
    await service.findAll({ page: 1, limit: 10, q: 'test' } as any);

    expect(prisma.abonnement.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            {
              patient: {
                OR: [
                  { firstName: { contains: 'test' } },
                  { lastName: { contains: 'test' } },
                ],
              },
            },
            { package: { nom: { contains: 'test' } } },
          ]),
        }),
      }),
    );
  });
});

// ─────────────────────────────────────────────────────
// confirm
// ─────────────────────────────────────────────────────
describe('confirm', () => {
  const aboPENDING = {
    abonnementId: 1,
    status: AbonnementStatus.PENDING,
    transactionId: 100,
    package: { nom: 'Cardio Basic' },
    patient: { userId: 1, firstName: 'John' },
  };

  beforeEach(() => {
    prisma.notification.create.mockResolvedValue({});
  });

  it('should throw NotFoundException if abonnement not found', async () => {
    prisma.abonnement.findUnique.mockResolvedValue(null);
    await expect(service.confirm(1)).rejects.toThrow(NotFoundException);
  });

  it('should return early if already confirmed (idempotent)', async () => {
    const aboConfirmed = {
      ...aboPENDING,
      status: AbonnementStatus.CONFIRMED,
    };
    prisma.abonnement.findUnique.mockResolvedValue(aboConfirmed);

    const result = await service.confirm(1);
    expect(result.message).toBeDefined();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('should confirm a pending abonnement', async () => {
    prisma.abonnement.findUnique.mockResolvedValue(aboPENDING);
    prisma.abonnement.update.mockResolvedValue({
      ...aboPENDING,
      status: AbonnementStatus.CONFIRMED,
    });
    prisma.transaction.update.mockResolvedValue({});

    mockTransactionCallback();
    const result = await service.confirm(1);

    expect(result.message).toBeDefined();
    expect(prisma.abonnement.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: AbonnementStatus.CONFIRMED,
        }),
      }),
    );
    expect(prisma.transaction.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: TransactionStatus.PAID,
        }),
      }),
    );
  });

  it('should send confirmation notification to patient', async () => {
    prisma.abonnement.findUnique.mockResolvedValue(aboPENDING);
    prisma.abonnement.update.mockResolvedValue({
      ...aboPENDING,
      status: AbonnementStatus.CONFIRMED,
    });
    prisma.transaction.update.mockResolvedValue({});

    mockTransactionCallback();
    await service.confirm(1);

    expect(prisma.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: 1 }),
      }),
    );
  });

  it('should skip notification if patient is null', async () => {
    const aboNoPatient = { ...aboPENDING, patient: null };
    prisma.abonnement.findUnique.mockResolvedValue(aboNoPatient);
    prisma.abonnement.update.mockResolvedValue({
      ...aboPENDING,
      status: AbonnementStatus.CONFIRMED,
    });

    mockTransactionCallback();
    await service.confirm(1);

    expect(prisma.notification.create).not.toHaveBeenCalled();
  });

  it('should skip transaction update if transactionId is missing', async () => {
    const aboNoTx = { ...aboPENDING, transactionId: null };
    prisma.abonnement.findUnique.mockResolvedValue(aboNoTx);
    prisma.abonnement.update.mockResolvedValue({
      ...aboPENDING,
      transactionId: null,
      status: AbonnementStatus.CONFIRMED,
    });

    mockTransactionCallback();
    const result = await service.confirm(1);

    expect(prisma.transaction.update).not.toHaveBeenCalled();
    expect(result.message).toBeDefined();
  });
});

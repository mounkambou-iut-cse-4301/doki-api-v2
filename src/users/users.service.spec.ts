import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { UserType, Sex } from 'generated/prisma';

jest.mock('src/utils/cloudinary', () => ({
  uploadImageToCloudinary: jest.fn(),
}));

import { uploadImageToCloudinary } from 'src/utils/cloudinary';

const makePrisma = () => ({
  user: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  },
  role: { findMany: jest.fn(), findUnique: jest.fn() },
  userRole: {
    createMany: jest.fn(),
    upsert: jest.fn(),
    delete: jest.fn(),
  },
  speciality: { findUnique: jest.fn() },
  feedback: { groupBy: jest.fn(), aggregate: jest.fn() },
  $transaction: jest.fn((fns: any[]) => Promise.all(fns)),
});

describe('UsersService', () => {
  let service: UsersService;
  let prisma: ReturnType<typeof makePrisma>;

  beforeEach(async () => {
    prisma = makePrisma();

    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(UsersService);
    jest.clearAllMocks();
  });

  // ─────────────────────── signupPatient ───────────────────────
  describe('signupPatient', () => {
    const dto = {
      firstName: 'John',
      lastName: 'Doe',
      sex: Sex.MALE,
      email: 'john@test.com',
      phone: '+237600000000',
      password: 'secret123',
      acceptPrivacy: true,
    };

    it('should create a patient successfully', async () => {
      prisma.user.findFirst.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        userId: 1,
        ...dto,
        userType: UserType.PATIENT,
      });

      const result = await service.signupPatient(dto);

      expect(prisma.user.findFirst).toHaveBeenCalledTimes(2);
      expect(prisma.user.create).toHaveBeenCalledTimes(1);
      expect(result).toHaveProperty('userId', 1);
    });

    it('should throw ConflictException on duplicate email', async () => {
      prisma.user.findFirst.mockResolvedValueOnce({
        userId: 99,
        email: dto.email,
      });

      await expect(service.signupPatient(dto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw ConflictException on duplicate phone', async () => {
      prisma.user.findFirst
        .mockResolvedValueOnce(null) // email check passes
        .mockResolvedValueOnce({ userId: 99, phone: dto.phone });

      await expect(service.signupPatient(dto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw BadRequestException on generic error', async () => {
      prisma.user.findFirst.mockRejectedValue(new Error('DB error'));

      await expect(service.signupPatient(dto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ─────────────────────── signupMedecin ───────────────────────
  describe('signupMedecin', () => {
    const baseDto = {
      firstName: 'Dr',
      lastName: 'Smith',
      sex: Sex.MALE,
      email: 'doc@test.com',
      phone: '+237611111111',
      password: 'secret123',
      acceptPrivacy: true,
    };

    it('should create a medecin without specialityId or document', async () => {
      prisma.user.findFirst.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        userId: 2,
        ...baseDto,
        userType: UserType.MEDECIN,
      });

      const result = await service.signupMedecin(baseDto);

      expect(prisma.speciality.findUnique).not.toHaveBeenCalled();
      expect(prisma.user.create).toHaveBeenCalledTimes(1);
      expect(result).toHaveProperty('userId', 2);
    });

    it('should create a medecin with specialityId', async () => {
      prisma.user.findFirst.mockResolvedValue(null);
      prisma.speciality.findUnique.mockResolvedValue({
        specialityId: 10,
        name: 'Cardio',
      });
      prisma.user.create.mockResolvedValue({
        userId: 2,
        ...baseDto,
        specialityId: 10,
        userType: UserType.MEDECIN,
      });

      const result = await service.signupMedecin({
        ...baseDto,
        specialityId: 10,
      });

      expect(prisma.speciality.findUnique).toHaveBeenCalledWith({
        where: { specialityId: 10 },
      });
      expect(result).toHaveProperty('userId', 2);
    });

    it('should throw BadRequestException if speciality not found', async () => {
      prisma.user.findFirst.mockResolvedValue(null);
      prisma.speciality.findUnique.mockResolvedValue(null);

      await expect(
        service.signupMedecin({ ...baseDto, specialityId: 999 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should upload document as URL directly', async () => {
      prisma.user.findFirst.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({ userId: 2 });

      const docUrl = 'https://res.cloudinary.com/demo/doc.pdf';
      await service.signupMedecin({ ...baseDto, document: docUrl });

      expect(uploadImageToCloudinary).not.toHaveBeenCalled();
      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          data: expect.objectContaining({ document: docUrl }),
        }),
      );
    });

    it('should upload base64 document to cloudinary', async () => {
      prisma.user.findFirst.mockResolvedValue(null);
      (uploadImageToCloudinary as jest.Mock).mockResolvedValue(
        'https://cloudinary.com/uploaded.pdf',
      );
      prisma.user.create.mockResolvedValue({ userId: 2 });

      const base64Doc = 'data:application/pdf;base64,JVBERi0xLjQ=';
      await service.signupMedecin({ ...baseDto, document: base64Doc });

      expect(uploadImageToCloudinary).toHaveBeenCalledWith(
        base64Doc,
        'medecins/documents/Dr_Smith',
      );
      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          data: expect.objectContaining({
            document: 'https://cloudinary.com/uploaded.pdf',
          }),
        }),
      );
    });

    it('should throw BadRequestException on upload failure', async () => {
      prisma.user.findFirst.mockResolvedValue(null);
      (uploadImageToCloudinary as jest.Mock).mockRejectedValue(
        new Error('Upload failed'),
      );

      await expect(
        service.signupMedecin({
          ...baseDto,
          document: 'data:image/png;base64,abc',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException on duplicate email', async () => {
      prisma.user.findFirst.mockResolvedValueOnce({ userId: 99 });

      await expect(service.signupMedecin(baseDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw ConflictException on duplicate phone', async () => {
      prisma.user.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ userId: 99 });

      await expect(service.signupMedecin(baseDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  // ─────────────────────── updatePatient ───────────────────────
  describe('updatePatient', () => {
    const existingPatient = {
      userId: 1,
      userType: UserType.PATIENT,
      email: 'old@test.com',
      phone: '+237600000000',
    };

    it('should update a patient successfully', async () => {
      prisma.user.findUnique.mockResolvedValue(existingPatient);
      prisma.user.update.mockResolvedValue({
        ...existingPatient,
        firstName: 'Updated',
      });

      const result = await service.updatePatient(1, { firstName: 'Updated' });

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { userId: 1 },
        data: { firstName: 'Updated' },
      });
      expect(result).toHaveProperty('firstName', 'Updated');
    });

    it('should throw NotFoundException if patient not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.updatePatient(999, { firstName: 'X' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if user is not PATIENT type', async () => {
      prisma.user.findUnique.mockResolvedValue({
        ...existingPatient,
        userType: UserType.MEDECIN,
      });

      await expect(
        service.updatePatient(1, { firstName: 'X' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException on duplicate email', async () => {
      prisma.user.findUnique.mockResolvedValue(existingPatient);
      prisma.user.findFirst.mockResolvedValue({
        userId: 55,
        email: 'taken@test.com',
      });

      await expect(
        service.updatePatient(1, { email: 'taken@test.com' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException on duplicate phone', async () => {
      prisma.user.findUnique.mockResolvedValue(existingPatient);
      prisma.user.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ userId: 55, phone: '+237699999999' });

      await expect(
        service.updatePatient(1, { phone: '+237699999999' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should skip uniqueness check when no email or phone changed', async () => {
      prisma.user.findUnique.mockResolvedValue(existingPatient);
      prisma.user.update.mockResolvedValue({
        ...existingPatient,
        firstName: 'New',
      });

      await service.updatePatient(1, { firstName: 'New' });

      expect(prisma.user.findFirst).not.toHaveBeenCalled();
    });
  });

  // ─────────────────────── updateMedecin ───────────────────────
  describe('updateMedecin', () => {
    const existingMed = {
      userId: 2,
      userType: UserType.MEDECIN,
      email: 'doc@test.com',
      phone: '+237611111111',
    };

    it('should update a medecin successfully', async () => {
      prisma.user.findUnique.mockResolvedValue(existingMed);
      prisma.user.update.mockResolvedValue({
        ...existingMed,
        firstName: 'Dr Updated',
      });

      const result = await service.updateMedecin(2, {
        firstName: 'Dr Updated',
      });

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { userId: 2 },
        data: { firstName: 'Dr Updated' },
      });
      expect(result).toHaveProperty('firstName', 'Dr Updated');
    });

    it('should throw NotFoundException if medecin not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.updateMedecin(999, { firstName: 'X' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if user is not MEDECIN type', async () => {
      prisma.user.findUnique.mockResolvedValue({
        ...existingMed,
        userType: UserType.PATIENT,
      });

      await expect(
        service.updateMedecin(2, { firstName: 'X' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException on duplicate email', async () => {
      prisma.user.findUnique.mockResolvedValue(existingMed);
      prisma.user.findFirst.mockResolvedValue({ userId: 55 });

      await expect(
        service.updateMedecin(2, { email: 'taken@test.com' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException on duplicate phone', async () => {
      prisma.user.findUnique.mockResolvedValue(existingMed);
      prisma.user.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ userId: 55 });

      await expect(
        service.updateMedecin(2, { phone: '+237688888888' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should skip uniqueness check when no email or phone changed', async () => {
      prisma.user.findUnique.mockResolvedValue(existingMed);
      prisma.user.update.mockResolvedValue({
        ...existingMed,
        firstName: 'New',
      });

      await service.updateMedecin(2, { firstName: 'New' });

      expect(prisma.user.findFirst).not.toHaveBeenCalled();
    });
  });

  // ─────────────────────── findAll ───────────────────────
  describe('findAll', () => {
    const makeUser = (overrides: Record<string, unknown>) => ({
      userId: 1,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@test.com',
      phone: '+237600000000',
      userType: UserType.PATIENT,
      speciality: null,
      plannings: [],
      soldes: [],
      feedbacksMed: [],
      feedbacksPat: [],
      ...overrides,
    });

    it('should return paginated items with meta', async () => {
      const user = makeUser({});
      prisma.user.findMany.mockResolvedValue([user]);
      prisma.user.count.mockResolvedValue(1);
      prisma.user.findUnique.mockResolvedValue(null);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result).toHaveProperty('items1');
      expect(result).toHaveProperty('meta');
      expect(result.meta).toEqual(
        expect.objectContaining({ total: 1, page: 1, limit: 10, lastPage: 1 }),
      );
      expect(result.items1).toHaveLength(1);
    });

    it('should apply q filter', async () => {
      prisma.user.findMany.mockResolvedValue([]);
      prisma.user.count.mockResolvedValue(0);

      await service.findAll({ q: 'ali', page: 1, limit: 10 });

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { firstName: { contains: 'ali' } },
              { lastName: { contains: 'ali' } },
              { email: { contains: 'ali' } },
              { phone: { contains: 'ali' } },
            ],
          },
        }),
      );
    });

    it('should fallback to name param when q is not provided', async () => {
      prisma.user.findMany.mockResolvedValue([]);
      prisma.user.count.mockResolvedValue(0);

      await service.findAll({ name: 'bob', page: 1, limit: 10 });

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { firstName: { contains: 'bob' } },
              { lastName: { contains: 'bob' } },
              { email: { contains: 'bob' } },
              { phone: { contains: 'bob' } },
            ],
          },
        }),
      );
    });

    it('should apply userType filter', async () => {
      prisma.user.findMany.mockResolvedValue([]);
      prisma.user.count.mockResolvedValue(0);

      await service.findAll({ userType: UserType.MEDECIN, page: 1, limit: 10 });

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userType: UserType.MEDECIN },
        }),
      );
    });

    it('should apply isBlock filter', async () => {
      prisma.user.findMany.mockResolvedValue([]);
      prisma.user.count.mockResolvedValue(0);

      await service.findAll({ isBlock: 'true', page: 1, limit: 10 });

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isBlock: true },
        }),
      );
    });

    it('should apply isVerified filter', async () => {
      prisma.user.findMany.mockResolvedValue([]);
      prisma.user.count.mockResolvedValue(0);

      await service.findAll({ isVerified: 'false', page: 1, limit: 10 });

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isVerified: false },
        }),
      );
    });

    it('should trigger rating sort when specialityId is provided', async () => {
      const med1 = makeUser({
        userId: 10,
        userType: UserType.MEDECIN,
        specialityId: 5,
        firstName: 'Alice',
      });
      const med2 = makeUser({
        userId: 20,
        userType: UserType.MEDECIN,
        specialityId: 5,
        firstName: 'Bob',
      });
      prisma.user.findMany.mockResolvedValue([med1, med2]);
      prisma.user.count.mockResolvedValue(2);
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.feedback.groupBy.mockResolvedValue([
        { medecinId: 10, _avg: { note: 4.5 }, _count: { _all: 10 } },
        { medecinId: 20, _avg: { note: 3.0 }, _count: { _all: 5 } },
      ]);

      const result = await service.findAll({
        specialityId: 5,
        page: 1,
        limit: 10,
      });

      expect(prisma.feedback.groupBy).toHaveBeenCalled();
      expect(result.meta).toHaveProperty('sortedByRating', true);
    });

    it('should enrich medecin feedbacks with patient info', async () => {
      const med = makeUser({
        userId: 10,
        userType: UserType.MEDECIN,
        feedbacksMed: [
          { patientId: 50, content: 'Great', note: 5, createdAt: new Date() },
        ],
      });
      prisma.user.findMany.mockResolvedValue([med]);
      prisma.user.count.mockResolvedValue(1);
      prisma.feedback.groupBy.mockResolvedValue([]);
      prisma.user.findUnique.mockResolvedValue({
        userId: 50,
        firstName: 'Patient',
        lastName: 'One',
        profile: null,
      });

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.items1[0].lastFeedbacks).toHaveLength(1);
      expect(result.items1[0].lastFeedbacks[0]).toHaveProperty('patient');
    });

    it('should not include averageNote when no specialityId filter', async () => {
      const med = makeUser({ userType: UserType.MEDECIN });
      prisma.user.findMany.mockResolvedValue([med]);
      prisma.user.count.mockResolvedValue(1);
      prisma.feedback.groupBy.mockResolvedValue([]);
      prisma.user.findUnique.mockResolvedValue(null);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.meta).toHaveProperty('sortedByRating', false);
    });

    it('should use default page=1 and limit=10 when not provided', async () => {
      prisma.user.findMany.mockResolvedValue([]);
      prisma.user.count.mockResolvedValue(0);

      const result = await service.findAll({});

      expect(result.meta).toEqual(
        expect.objectContaining({ page: 1, limit: 10 }),
      );
    });

    it('should throw BadRequestException for invalid page', async () => {
      await expect(service.findAll({ page: 0, limit: 10 })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for invalid limit', async () => {
      await expect(service.findAll({ page: 1, limit: 0 })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException on db error', async () => {
      prisma.user.findMany.mockRejectedValue(new Error('DB error'));

      await expect(service.findAll({ page: 1, limit: 10 })).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ─────────────────────── findOne ───────────────────────
  describe('findOne', () => {
    const patientUser = {
      userId: 1,
      firstName: 'John',
      userType: UserType.PATIENT,
      speciality: null,
      favoritesMed: [],
      favoritesPat: [],
      roles: [],
      plannings: [{ planningId: 1 }],
      soldes: [{ soldeId: 1 }],
      feedbacksMed: [],
      feedbacksPat: [],
    };

    const medecinUser = {
      ...patientUser,
      userId: 2,
      userType: UserType.MEDECIN,
      feedbacksMed: [
        { patientId: 50, content: 'ok', note: 4, createdAt: new Date() },
      ],
    };

    it('should return a patient user', async () => {
      prisma.user.findUnique.mockResolvedValue(patientUser);

      const result = await service.findOne(1);

      expect(result).toHaveProperty('userId', 1);
      expect(result).toHaveProperty('planning', { planningId: 1 });
      expect(result).toHaveProperty('solde', { soldeId: 1 });
      expect(result).toHaveProperty('feedbackRating', null);
    });

    it('should throw NotFoundException if user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });

    it('should compute feedbackRating for medecin', async () => {
      prisma.user.findUnique.mockResolvedValue(medecinUser);
      prisma.user.findUnique.mockResolvedValueOnce(medecinUser);
      prisma.user.findUnique.mockResolvedValueOnce({
        userId: 50,
        firstName: 'P',
        lastName: 'One',
        profile: null,
      });
      prisma.feedback.aggregate.mockResolvedValue({
        _avg: { note: 4.2 },
        _count: { _all: 15 },
      });

      const result = await service.findOne(2);

      expect(result.feedbackRating).toEqual({ average: 4.2, count: 15 });
      expect(result.lastFeedbacks[0]).toHaveProperty('patient');
    });

    it('should return null feedbackRating for patient', async () => {
      prisma.user.findUnique.mockResolvedValue(patientUser);

      const result = await service.findOne(1);

      expect(result.feedbackRating).toBeNull();
    });

    it('should throw BadRequestException on db error', async () => {
      prisma.user.findUnique.mockRejectedValue(new Error('DB error'));

      await expect(service.findOne(1)).rejects.toThrow(BadRequestException);
    });
  });

  // ─────────────────────── signupAdmin ───────────────────────
  describe('signupAdmin', () => {
    const adminDto = {
      firstName: 'Admin',
      lastName: 'User',
      sex: Sex.MALE,
      email: 'admin@test.com',
      phone: '+237622222222',
      password: 'secret123',
    };

    it('should create an admin without roleIds', async () => {
      prisma.user.findFirst.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({ userId: 3 });
      // findOne is internally called after creation to return the full admin
      prisma.user.findUnique.mockResolvedValue({
        userId: 3,
        firstName: 'Admin',
        lastName: 'User',
        userType: UserType.ADMIN,
        speciality: null,
        favoritesMed: [],
        favoritesPat: [],
        roles: [],
        plannings: [],
        soldes: [],
        feedbacksMed: [],
        feedbacksPat: [],
      });

      const result = await service.signupAdmin(adminDto);

      expect(prisma.user.create).toHaveBeenCalledTimes(1);
      expect(prisma.userRole.createMany).not.toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(result).toHaveProperty('userId', 3);
    });

    it('should create an admin with roleIds', async () => {
      prisma.user.findFirst.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({ userId: 3 });
      prisma.role.findMany.mockResolvedValue([{ roleId: 1 }, { roleId: 2 }]);
      prisma.userRole.createMany.mockResolvedValue({ count: 2 });
      prisma.user.findUnique.mockResolvedValue({
        userId: 3,
        userType: UserType.ADMIN,
        speciality: null,
        favoritesMed: [],
        favoritesPat: [],
        roles: [{ role: { roleId: 1 } }, { role: { roleId: 2 } }],
        plannings: [],
        soldes: [],
        feedbacksMed: [],
        feedbacksPat: [],
      });

      await service.signupAdmin({ ...adminDto, roleIds: [1, 2] });

      expect(prisma.role.findMany).toHaveBeenCalledWith({
        where: { roleId: { in: [1, 2] } },
      });
      expect(prisma.userRole.createMany).toHaveBeenCalledWith({
        data: [
          { userId: 3, roleId: 1 },
          { userId: 3, roleId: 2 },
        ],
        skipDuplicates: true,
      });
    });

    it('should create a superadmin when isSuperAdmin is true', async () => {
      prisma.user.findFirst.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({ userId: 4 });
      prisma.user.findUnique.mockResolvedValue({
        userId: 4,
        userType: UserType.SUPERADMIN,
        speciality: null,
        favoritesMed: [],
        favoritesPat: [],
        roles: [],
        plannings: [],
        soldes: [],
        feedbacksMed: [],
        feedbacksPat: [],
      });

      await service.signupAdmin({ ...adminDto, isSuperAdmin: true });

      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          data: expect.objectContaining({ userType: UserType.SUPERADMIN }),
        }),
      );
    });

    it('should throw ConflictException on duplicate email', async () => {
      prisma.user.findFirst.mockResolvedValueOnce({ userId: 99 });

      await expect(service.signupAdmin(adminDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw ConflictException on duplicate phone', async () => {
      prisma.user.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ userId: 99 });

      await expect(service.signupAdmin(adminDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw BadRequestException on generic error', async () => {
      prisma.user.findFirst.mockRejectedValue(new Error('DB failure'));

      await expect(service.signupAdmin(adminDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ─────────────────────── addRoleToAdmin ───────────────────────
  describe('addRoleToAdmin', () => {
    it('should add a role to an admin successfully', async () => {
      prisma.user.findUnique.mockResolvedValue({
        userId: 3,
        userType: UserType.ADMIN,
      });
      prisma.role.findUnique.mockResolvedValue({ roleId: 1, name: 'editor' });
      prisma.userRole.upsert.mockResolvedValue({});

      const result = await service.addRoleToAdmin(3, 1);

      expect(prisma.userRole.upsert).toHaveBeenCalled();
      expect(result).toEqual({
        message: 'Rôle attribué.',
        userId: 3,
        roleId: 1,
      });
    });

    it('should throw BadRequestException if user is not an admin', async () => {
      prisma.user.findUnique.mockResolvedValue({
        userId: 5,
        userType: UserType.PATIENT,
      });

      await expect(service.addRoleToAdmin(5, 1)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.addRoleToAdmin(999, 1)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException if role not found', async () => {
      prisma.user.findUnique.mockResolvedValue({
        userId: 3,
        userType: UserType.ADMIN,
      });
      prisma.role.findUnique.mockResolvedValue(null);

      await expect(service.addRoleToAdmin(3, 999)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should work for SUPERADMIN user type', async () => {
      prisma.user.findUnique.mockResolvedValue({
        userId: 4,
        userType: UserType.SUPERADMIN,
      });
      prisma.role.findUnique.mockResolvedValue({ roleId: 2 });
      prisma.userRole.upsert.mockResolvedValue({});

      const result = await service.addRoleToAdmin(4, 2);

      expect(result).toEqual({
        message: 'Rôle attribué.',
        userId: 4,
        roleId: 2,
      });
    });
  });

  // ─────────────────────── removeRoleFromAdmin ───────────────────────
  describe('removeRoleFromAdmin', () => {
    it('should remove a role from an admin successfully', async () => {
      prisma.role.findUnique.mockResolvedValue({ roleId: 1 });
      prisma.userRole.delete.mockResolvedValue({});

      const result = await service.removeRoleFromAdmin(3, 1);

      expect(prisma.userRole.delete).toHaveBeenCalledWith({
        where: { userId_roleId: { userId: 3, roleId: 1 } },
      });
      expect(result).toEqual({ message: 'Rôle retiré.', userId: 3, roleId: 1 });
    });

    it('should throw NotFoundException if role not found', async () => {
      prisma.role.findUnique.mockResolvedValue(null);

      await expect(service.removeRoleFromAdmin(3, 999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});

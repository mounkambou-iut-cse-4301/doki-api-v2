import { Test, TestingModule } from '@nestjs/testing';
import { SpecialitiesService } from './specialities.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';

describe('SpecialitiesService', () => {
  let service: SpecialitiesService;
  let prisma: Record<string, any>;

  const createDto = {
    name: 'Cardiologie',
    consultationPrice: 15000,
    consultationDuration: 30,
    planMonthAmount: 20000,
    numberOfTimePlanReservation: 3,
  } as any;

  const speciality = { specialityId: 1, ...createDto } as any;

  beforeEach(async () => {
    prisma = {
      speciality: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
      $transaction: jest.fn((fns: any[]) => Promise.all(fns)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SpecialitiesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(SpecialitiesService);
  });

  describe('createSpecialy', () => {
    it('should create a speciality when name is unique', async () => {
      prisma.speciality.findFirst.mockResolvedValue(null);
      prisma.speciality.create.mockResolvedValue(speciality);

      const result = await service.createSpecialy(createDto);

      expect(prisma.speciality.findFirst).toHaveBeenCalledWith({
        where: { name: { equals: createDto.name } },
      });
      expect(prisma.speciality.create).toHaveBeenCalledWith({
        data: createDto,
      });
      expect(result).toEqual(speciality);
    });

    it('should throw ConflictException when name already exists', async () => {
      prisma.speciality.findFirst.mockResolvedValue({ specialityId: 9 });

      await expect(service.createSpecialy(createDto)).rejects.toThrow(
        ConflictException,
      );
      expect(prisma.speciality.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException on generic error', async () => {
      prisma.speciality.findFirst.mockRejectedValue(new Error('db down'));

      await expect(service.createSpecialy(createDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('update', () => {
    it('should update a speciality when found and name is not conflicting', async () => {
      prisma.speciality.findUnique.mockResolvedValue(speciality);
      prisma.speciality.update.mockResolvedValue({
        ...speciality,
        consultationPrice: 18000,
      });

      const result = await service.update(1, { consultationPrice: 18000 } as any);

      expect(prisma.speciality.findUnique).toHaveBeenCalledWith({
        where: { specialityId: 1 },
      });
      expect(prisma.speciality.update).toHaveBeenCalledWith({
        where: { specialityId: 1 },
        data: { consultationPrice: 18000 },
      });
      expect(result.consultationPrice).toBe(18000);
    });

    it('should throw NotFoundException when speciality does not exist', async () => {
      prisma.speciality.findUnique.mockResolvedValue(null);

      await expect(service.update(999, { name: 'X' } as any)).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.speciality.update).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when a changed name already exists', async () => {
      prisma.speciality.findUnique.mockResolvedValue(speciality);
      prisma.speciality.findFirst.mockResolvedValue({ specialityId: 5 });

      await expect(
        service.update(1, { name: 'Dermatologie' } as any),
      ).rejects.toThrow(ConflictException);
      expect(prisma.speciality.findFirst).toHaveBeenCalledWith({
        where: { name: 'Dermatologie' },
      });
    });

    it('should allow keeping the same name (no conflict check)', async () => {
      prisma.speciality.findUnique.mockResolvedValue(speciality);
      prisma.speciality.findFirst.mockResolvedValue(null);
      prisma.speciality.update.mockResolvedValue({
        ...speciality,
        consultationPrice: 20000,
      });

      const result = await service.update(1, {
        name: 'cardiologie',
        consultationPrice: 20000,
      } as any);

      expect(result.consultationPrice).toBe(20000);
      expect(prisma.speciality.findFirst).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException even when name conflicts', async () => {
      prisma.speciality.findUnique.mockResolvedValue(null);

      await expect(service.update(4, { name: 'X' } as any)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated items with meta', async () => {
      const items = [speciality, { specialityId: 2, name: 'Dermatologie' }];
      prisma.speciality.findMany.mockResolvedValue(items);
      prisma.speciality.count.mockResolvedValue(25);

      const result = await service.findAll({ page: 2, limit: 10 } as any);

      expect(result.items).toEqual(items);
      expect(result.meta).toEqual({
        total: 25,
        page: 2,
        limit: 10,
        lastPage: 3,
      });
      expect(prisma.$transaction).toHaveBeenCalledWith([
        expect.anything(),
        expect.anything(),
      ]);
    });

    it('should default to page 1 and limit 10', async () => {
      prisma.speciality.findMany.mockResolvedValue([]);
      prisma.speciality.count.mockResolvedValue(0);

      const result = await service.findAll({} as any);

      expect(result.meta).toEqual({ total: 0, page: 1, limit: 10, lastPage: 0 });
      expect(prisma.speciality.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 10,
        orderBy: { name: 'asc' },
      });
    });

    it('should apply the q filter on name', async () => {
      prisma.speciality.findMany.mockResolvedValue([speciality]);
      prisma.speciality.count.mockResolvedValue(1);

      await service.findAll({ q: '  cardio  ', page: 1, limit: 10 } as any);

      expect(prisma.speciality.findMany).toHaveBeenCalledWith({
        where: { name: { contains: 'cardio' } },
        skip: 0,
        take: 10,
        orderBy: { name: 'asc' },
      });
      expect(prisma.speciality.count).toHaveBeenCalledWith({
        where: { name: { contains: 'cardio' } },
      });
    });
  });

  describe('findOne', () => {
    it('should return the speciality when found', async () => {
      prisma.speciality.findUnique.mockResolvedValue(speciality);

      const result = await service.findOne(1);

      expect(prisma.speciality.findUnique).toHaveBeenCalledWith({
        where: { specialityId: 1 },
      });
      expect(result).toEqual(speciality);
    });

    it('should throw NotFoundException when speciality does not exist', async () => {
      prisma.speciality.findUnique.mockResolvedValue(null);

      await expect(service.findOne(42)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException on generic error', async () => {
      prisma.speciality.findUnique.mockRejectedValue(new Error('db down'));

      await expect(service.findOne(1)).rejects.toThrow(BadRequestException);
    });
  });
});
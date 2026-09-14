import { Test, TestingModule } from '@nestjs/testing';
import { PackageService } from './package.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('PackageService', () => {
  let service: PackageService;
  let prisma: Record<string, any>;

  beforeEach(async () => {
    prisma = {
      speciality: { findUnique: jest.fn() },
      groupePackage: { findFirst: jest.fn(), findMany: jest.fn(), count: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn(), findUnique: jest.fn() },
      $transaction: jest.fn((fns: any[]) => Promise.all(fns)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [PackageService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(PackageService);
  });

  describe('create', () => {
    it('should throw if speciality not found', async () => {
      prisma.speciality.findUnique.mockResolvedValue(null);
      await expect(service.create({ specialityId: 999, nom: 'X', nombreConsultations: 5, prix: 1000, dureeValiditeJours: 30 } as any)).rejects.toThrow(NotFoundException);
    });
    it('should throw if duplicate name', async () => {
      prisma.speciality.findUnique.mockResolvedValue({ specialityId: 1 });
      prisma.groupePackage.findFirst.mockResolvedValue({ groupePackageId: 1 });
      await expect(service.create({ specialityId: 1, nom: 'X', nombreConsultations: 5, prix: 1000, dureeValiditeJours: 30 } as any)).rejects.toThrow(ConflictException);
    });
    it('should create package', async () => {
      prisma.speciality.findUnique.mockResolvedValue({ specialityId: 1 });
      prisma.groupePackage.findFirst.mockResolvedValue(null);
      prisma.groupePackage.create.mockResolvedValue({ groupePackageId: 1 });
      const result = await service.create({ specialityId: 1, nom: 'Premium', nombreConsultations: 5, prix: 10000, dureeValiditeJours: 30 } as any);
      expect(result.data).toBeDefined();
    });
  });

  describe('findAll', () => {
    it('should return paginated packages', async () => {
      prisma.groupePackage.findMany.mockResolvedValue([]);
      prisma.groupePackage.count.mockResolvedValue(0);
      const result = await service.findAll({});
      expect(result.data).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should throw if not found', async () => {
      prisma.groupePackage.findUnique.mockResolvedValue(null);
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should throw if not found', async () => {
      prisma.groupePackage.findUnique.mockResolvedValue(null);
      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });
});

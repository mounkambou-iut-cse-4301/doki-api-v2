import { Test, TestingModule } from '@nestjs/testing';
import { ProtocolesOrdonanceService } from './protocoles-ordonance.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

jest.mock('src/utils/cloudinary', () => ({ uploadImageToCloudinary: jest.fn().mockResolvedValue('https://img.url') }));

describe('ProtocolesOrdonanceService', () => {
  let service: ProtocolesOrdonanceService;
  let prisma: Record<string, any>;

  beforeEach(async () => {
    prisma = {
      protocoleOrdonance: { findUnique: jest.fn(), findMany: jest.fn(), count: jest.fn(), create: jest.fn(), update: jest.fn() },
      medicament: { findUnique: jest.fn(), findMany: jest.fn(), count: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
      $transaction: jest.fn((fns: any[]) => Promise.all(fns)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [ProtocolesOrdonanceService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(ProtocolesOrdonanceService);
  });

  describe('findAll', () => {
    it('should return paginated protocoles', async () => {
      prisma.$transaction.mockResolvedValue([[], 0]);
      const result = await service.findAll({});
      expect(result.items).toEqual([]);
    });
    it('should throw on invalid page', async () => {
      await expect(service.findAll({ page: 0, limit: 10 })).rejects.toThrow(BadRequestException);
    });
  });

  describe('findOne', () => {
    it('should throw if not found', async () => {
      prisma.protocoleOrdonance.findUnique.mockResolvedValue(null);
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should throw if duplicate name', async () => {
      prisma.protocoleOrdonance.findUnique.mockResolvedValue({ name: 'Grippe' });
      await expect(service.create({ name: 'Grippe', traitement: [] } as any)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAllMedicaments', () => {
    it('should return paginated medicaments', async () => {
      prisma.$transaction.mockResolvedValue([[], 0]);
      const result = await service.findAllMedicaments({});
      expect(result.items).toEqual([]);
    });
  });

  describe('findOneMedicament', () => {
    it('should throw if not found', async () => {
      prisma.medicament.findUnique.mockResolvedValue(null);
      await expect(service.findOneMedicament(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteMedicament', () => {
    it('should throw if not found', async () => {
      prisma.medicament.findUnique.mockResolvedValue(null);
      await expect(service.deleteMedicament(999)).rejects.toThrow(NotFoundException);
    });
    it('should delete medicament', async () => {
      prisma.medicament.findUnique.mockResolvedValue({ medicamentId: 1 });
      prisma.medicament.delete.mockResolvedValue({ medicamentId: 1 });
      const result = await service.deleteMedicament(1);
      expect(result.message).toContain('supprimé');
    });
  });
});

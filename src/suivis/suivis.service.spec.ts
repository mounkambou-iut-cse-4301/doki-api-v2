import { Test, TestingModule } from '@nestjs/testing';
import { SuivisService } from './suivis.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('SuivisService', () => {
  let service: SuivisService;
  let prisma: Record<string, any>;

  beforeEach(async () => {
    prisma = {
      suivi: { findUnique: jest.fn(), findMany: jest.fn(), count: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn(), deleteMany: jest.fn() },
      user: { findUnique: jest.fn() },
      ordonance: { findUnique: jest.fn() },
      $transaction: jest.fn((fns: any[]) => Promise.all(fns)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [SuivisService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(SuivisService);
  });

  describe('findAll', () => {
    it('should return paginated suivis', async () => {
      prisma.$transaction.mockResolvedValue([[], 0]);
      const result = await service.findAll({ page: 1, limit: 10 });
      expect(result.items).toEqual([]);
    });
    it('should throw on invalid page', async () => {
      await expect(service.findAll({ page: 0, limit: 10 })).rejects.toThrow(BadRequestException);
    });
  });

  describe('findOne', () => {
    it('should throw if not found', async () => {
      prisma.suivi.findUnique.mockResolvedValue(null);
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
    it('should return suivi', async () => {
      prisma.suivi.findUnique.mockResolvedValue({ suiviId: 1 });
      const result = await service.findOne(1);
      expect(result.item).toBeDefined();
    });
  });

  describe('create', () => {
    it('should throw if patient not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service.create({ patientId: 999, name: 'X', dosage: '10mg', posologie: '1x/jour', startDate: '2025-01-01', endDate: '2025-01-30', notificationTimes: ['08:00'], isActive: true } as any)).rejects.toThrow(NotFoundException);
    });
    it('should create suivi', async () => {
      prisma.user.findUnique.mockResolvedValue({ userId: 1 });
      prisma.suivi.create.mockResolvedValue({ suiviId: 1 });
      const result = await service.create({ patientId: 1, name: 'X', dosage: '10mg', posologie: '1x/jour', startDate: '2025-01-01', endDate: '2025-01-30', notificationTimes: ['08:00'], isActive: true } as any);
      expect(result.item).toBeDefined();
    });
    it('should throw if start > end', async () => {
      prisma.user.findUnique.mockResolvedValue({ userId: 1 });
      await expect(service.create({ patientId: 1, name: 'X', dosage: '10mg', posologie: '1x/jour', startDate: '2025-01-30', endDate: '2025-01-01', notificationTimes: ['08:00'], isActive: true } as any)).rejects.toThrow(BadRequestException);
    });
  });

  describe('update', () => {
    it('should throw if not found', async () => {
      prisma.suivi.findUnique.mockResolvedValue(null);
      await expect(service.update(999, {} as any)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should throw if not found', async () => {
      prisma.suivi.findUnique.mockResolvedValue(null);
      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
    it('should delete suivi', async () => {
      prisma.suivi.findUnique.mockResolvedValue({ suiviId: 1 });
      prisma.suivi.delete.mockResolvedValue({ suiviId: 1 });
      const result = await service.remove(1);
      expect(result.messageE).toContain('deleted');
    });
  });

  describe('removeByOrdonance', () => {
    it('should call deleteMany', async () => {
      prisma.suivi.deleteMany.mockResolvedValue({ count: 3 });
      await service.removeByOrdonance(1);
      expect(prisma.suivi.deleteMany).toHaveBeenCalledWith({ where: { ordonanceId: 1 } });
    });
  });
});

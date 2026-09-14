import { Test, TestingModule } from '@nestjs/testing';
import { StatsService } from './stats.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('StatsService', () => {
  let service: StatsService;
  let prisma: Record<string, any>;

  beforeEach(async () => {
    prisma = {
      user: { findUnique: jest.fn() },
      abonnement: { count: jest.fn() },
      transaction: { aggregate: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [StatsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(StatsService);
  });

  describe('medecinStats', () => {
    it('should throw if doctor not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service.medecinStats(999)).rejects.toThrow(NotFoundException);
    });

    it('should return stats', async () => {
      prisma.user.findUnique.mockResolvedValue({ userId: 1, specialityId: 1, speciality: { name: 'Cardio' } });
      prisma.abonnement.count.mockResolvedValue(5);
      prisma.transaction.aggregate.mockResolvedValue({ _sum: { amount: 1000 } });
      const result = await service.medecinStats(1);
      expect(result.abonnés).toBe(5);
      expect(result.revenue).toBe(1000);
    });

    it('should return 0 subscribers if no speciality', async () => {
      prisma.user.findUnique.mockResolvedValue({ userId: 1, specialityId: null, speciality: null });
      prisma.transaction.aggregate.mockResolvedValue({ _sum: { amount: 0 } });
      const result = await service.medecinStats(1);
      expect(result.abonnés).toBe(0);
    });
  });
});

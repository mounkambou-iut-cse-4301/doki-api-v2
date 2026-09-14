import { Test, TestingModule } from '@nestjs/testing';
import { AdminsService } from './admins.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AdminsService', () => {
  let service: AdminsService;
  let prisma: Record<string, any>;

  beforeEach(async () => {
    prisma = {
      user: { count: jest.fn(), findUnique: jest.fn(), findMany: jest.fn(), update: jest.fn() },
      reservation: { groupBy: jest.fn(), count: jest.fn() },
      retrait: { count: jest.fn(), aggregate: jest.fn() },
      transaction: { aggregate: jest.fn(), findMany: jest.fn(), count: jest.fn(), findUnique: jest.fn(), groupBy: jest.fn() },
      feedback: { aggregate: jest.fn(), groupBy: jest.fn() },
      ordonance: { count: jest.fn() },
      soldeMedecin: { findFirst: jest.fn() },
      publicite: { count: jest.fn() },
      $transaction: jest.fn((fns: any[]) => Promise.all(fns)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [AdminsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(AdminsService);
  });

  describe('overview', () => {
    it('should return overview stats', async () => {
      prisma.user.count.mockResolvedValue(100);
      prisma.reservation.groupBy.mockResolvedValue([]);
      prisma.transaction.groupBy.mockResolvedValue([]);
      prisma.transaction.aggregate.mockResolvedValue({ _sum: { amount: 50000 } });
      const result = await service.overview();
      expect(result).toBeDefined();
      expect(result).toHaveProperty('totals');
    });
  });

  describe('topDoctors', () => {
    it('should return top doctors', async () => {
      prisma.feedback.groupBy.mockResolvedValue([]);
      prisma.user.findMany.mockResolvedValue([]);
      const result = await service.topDoctors();
      expect(result).toBeDefined();
    });
  });

  describe('revenueLast5Months', () => {
    it('should return revenue data', async () => {
      prisma.transaction.aggregate.mockResolvedValue({ _sum: { amount: 10000 } });
      const result = await service.revenueLast5Months();
      expect(result).toBeDefined();
    });
  });

  describe('verifyUser', () => {
    it('should throw if user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service.verifyUser(999)).rejects.toThrow();
    });
    it('should verify user', async () => {
      prisma.user.findUnique.mockResolvedValue({ userId: 1, isVerified: false });
      prisma.user.update.mockResolvedValue({ userId: 1, isVerified: true });
      const result = await service.verifyUser(1);
      expect(result).toBeDefined();
    });
  });

  describe('listTransactions', () => {
    it('should return transactions', async () => {
      prisma.transaction.findMany.mockResolvedValue([]);
      prisma.transaction.count.mockResolvedValue(0);
      const result = await service.listTransactions({});
      expect(result).toBeDefined();
    });
  });
});

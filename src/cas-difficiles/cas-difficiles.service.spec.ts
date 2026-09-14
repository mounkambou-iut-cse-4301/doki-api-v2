import { Test, TestingModule } from '@nestjs/testing';
import { CasDifficilesService } from './cas-difficiles.service';
import { PrismaService } from '../prisma/prisma.service';

describe('CasDifficilesService', () => {
  let service: CasDifficilesService;
  let prisma: Record<string, any>;

  beforeEach(async () => {
    prisma = {
      casDifficile: { findUnique: jest.fn(), findMany: jest.fn(), count: jest.fn(), create: jest.fn(), update: jest.fn() },
      casMessage: { findMany: jest.fn(), count: jest.fn(), create: jest.fn(), updateMany: jest.fn() },
      casReadState: { findUnique: jest.fn(), create: jest.fn(), upsert: jest.fn() },
      message: { findMany: jest.fn(), count: jest.fn(), create: jest.fn() },
      user: { findUnique: jest.fn() },
      $transaction: jest.fn((fns: any[]) => Promise.all(fns)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [CasDifficilesService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(CasDifficilesService);
  });

  describe('createCas', () => {
    it('should create a cas', async () => {
      prisma.user.findUnique.mockResolvedValue({ userId: 1, userType: 'MEDECIN' });
      prisma.casDifficile.create.mockResolvedValue({ casDifficileId: 1 });
      const result = await service.createCas({ name: 'Test', description: 'Desc', createdBy: 1 } as any);
      expect(result).toBeDefined();
    });
  });

  describe('listCas', () => {
    it('should return paginated cas', async () => {
      prisma.casDifficile.findMany.mockResolvedValue([]);
      prisma.casDifficile.count.mockResolvedValue(0);
      const result = await service.listCas({});
      expect(result).toBeDefined();
    });
  });

  describe('listCasMessages', () => {
    it('should throw if cas not found', async () => {
      prisma.casDifficile.findUnique.mockResolvedValue(null);
      await expect(service.listCasMessages(999, {})).rejects.toThrow();
    });
  });

  describe('markCasRead', () => {
    it('should mark cas as read', async () => {
      prisma.user.findUnique.mockResolvedValue({ userId: 1, userType: 'MEDECIN' });
      prisma.casReadState.upsert.mockResolvedValue({});
      const result = await service.markCasRead(1, 1);
      expect(result).toBeDefined();
    });
  });

  describe('casUnreadCount', () => {
    it('should return unread count', async () => {
      prisma.user.findUnique.mockResolvedValue({ userId: 1, userType: 'MEDECIN' });
      prisma.message.count.mockResolvedValue(5);
      prisma.casReadState.findUnique.mockResolvedValue({ lastReadAt: new Date('2099-01-01') });
      const result = await service.casUnreadCount(1, 1);
      expect(result).toBeDefined();
    });
  });
});

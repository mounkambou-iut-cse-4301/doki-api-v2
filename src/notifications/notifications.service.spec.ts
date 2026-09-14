import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let prisma: Record<string, any>;

  beforeEach(async () => {
    prisma = {
      user: { findUnique: jest.fn(), update: jest.fn() },
      notification: { findUnique: jest.fn(), findMany: jest.fn(), count: jest.fn(), create: jest.fn(), update: jest.fn() },
      $transaction: jest.fn((fns: any[]) => Promise.all(fns)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [NotificationsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(NotificationsService);
  });

  describe('saveExpoToken', () => {
    it('should save token', async () => {
      prisma.user.update.mockResolvedValue({});
      const result = await service.saveExpoToken({ userId: 1, expotoken: 'token' } as any);
      expect(result.messageE).toContain('saved');
    });
  });

  describe('create', () => {
    it('should throw if user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service.create({ userId: 999 } as any)).rejects.toThrow(NotFoundException);
    });
    it('should create notification', async () => {
      prisma.user.findUnique.mockResolvedValue({ userId: 1 });
      prisma.notification.create.mockResolvedValue({ notificationId: 1 });
      const result = await service.create({ userId: 1, title: 'X', message: 'Y' } as any);
      expect(result.notification).toBeDefined();
    });
  });

  describe('findAll', () => {
    it('should return paginated notifications', async () => {
      prisma.$transaction.mockResolvedValue([[], 0]);
      const result = await service.findAll({});
      expect(result.items).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should throw if not found', async () => {
      prisma.notification.findUnique.mockResolvedValue(null);
      await expect(service.findOne(999, 1)).rejects.toThrow(NotFoundException);
    });
    it('should throw if not owner', async () => {
      prisma.notification.findUnique.mockResolvedValue({ notificationId: 1, userId: 1 });
      await expect(service.findOne(1, 2)).rejects.toThrow(ForbiddenException);
    });
    it('should return notification', async () => {
      prisma.notification.findUnique.mockResolvedValue({ notificationId: 1, userId: 1 });
      const result = await service.findOne(1, 1);
      expect(result.notification).toBeDefined();
    });
  });

  describe('markAsRead', () => {
    it('should throw if not found', async () => {
      prisma.notification.findUnique.mockResolvedValue(null);
      await expect(service.markAsRead(999)).rejects.toThrow(NotFoundException);
    });
    it('should mark as read', async () => {
      prisma.notification.findUnique.mockResolvedValue({ notificationId: 1 });
      prisma.notification.update.mockResolvedValue({ notificationId: 1 });
      const result = await service.markAsRead(1);
      expect(result.data).toBeDefined();
    });
  });
});

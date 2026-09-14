import { Test, TestingModule } from '@nestjs/testing';
import { SettingsService } from './settings.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('SettingsService', () => {
  let service: SettingsService;
  let prisma: Record<string, any>;

  beforeEach(async () => {
    prisma = {
      setting: { findFirst: jest.fn(), create: jest.fn(), update: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [SettingsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(SettingsService);
  });

  describe('createOrUpdate', () => {
    it('should create settings if none exist', async () => {
      prisma.setting.findFirst.mockResolvedValue(null);
      prisma.setting.create.mockResolvedValue({ settingId: 1 });
      const result = await service.createOrUpdate({ onlineValue: 10, onsiteValue: 15 } as any, 1);
      expect(result.data).toBeDefined();
    });
    it('should update settings if they exist', async () => {
      prisma.setting.findFirst.mockResolvedValue({ settingId: 1 });
      prisma.setting.update.mockResolvedValue({ settingId: 1 });
      const result = await service.createOrUpdate({ onlineValue: 10, onsiteValue: 15 } as any, 1);
      expect(result.data).toBeDefined();
    });
    it('should throw on negative percentage', async () => {
      prisma.setting.findFirst.mockResolvedValue(null);
      await expect(service.createOrUpdate({ onlineType: 'PERCENTAGE', onlineValue: -5 } as any, 1)).rejects.toThrow(BadRequestException);
    });
    it('should throw on percentage > 100', async () => {
      prisma.setting.findFirst.mockResolvedValue(null);
      await expect(service.createOrUpdate({ onlineType: 'PERCENTAGE', onlineValue: 150 } as any, 1)).rejects.toThrow(BadRequestException);
    });
  });

  describe('getSettings', () => {
    it('should return default settings if none exist', async () => {
      prisma.setting.findFirst.mockResolvedValue(null);
      const result = await service.getSettings();
      expect(result.data).toBeDefined();
    });
    it('should return existing settings', async () => {
      prisma.setting.findFirst.mockResolvedValue({ settingId: 1, onlineType: 'PERCENTAGE', onlineValue: 10, createdAt: new Date(), updatedAt: new Date() });
      const result = (await service.getSettings()) as any;
      expect(result.data.settingId).toBe(1);
    });
  });

  describe('updateSettings', () => {
    it('should throw if no settings exist', async () => {
      prisma.setting.findFirst.mockResolvedValue(null);
      await expect(service.updateSettings({ onlineValue: 10 } as any, 1)).rejects.toThrow(NotFoundException);
    });
    it('should update settings', async () => {
      prisma.setting.findFirst.mockResolvedValue({ settingId: 1 });
      prisma.setting.update.mockResolvedValue({ settingId: 1 });
      const result = await service.updateSettings({ onlineValue: 10 } as any, 1);
      expect(result.data).toBeDefined();
    });
  });

  describe('calculateCommission', () => {
    it('should calculate percentage commission (online)', async () => {
      prisma.setting.findFirst.mockResolvedValue({ onlineType: 'PERCENTAGE', onlineValue: 10 });
      const result = await service.calculateCommission(10000, 'online');
      expect(result.commission).toBe(1000);
      expect(result.netAmount).toBe(9000);
    });
    it('should calculate fixed commission (onsite)', async () => {
      prisma.setting.findFirst.mockResolvedValue({ onsiteType: 'FIXED', onsiteValue: 2000 });
      const result = await service.calculateCommission(10000, 'onsite');
      expect(result.commission).toBe(2000);
      expect(result.netAmount).toBe(8000);
    });
    it('should use defaults when no settings', async () => {
      prisma.setting.findFirst.mockResolvedValue(null);
      const result = await service.calculateCommission(10000, 'online');
      expect(result.commission).toBe(1000);
      expect(result.netAmount).toBe(9000);
    });
    it('should cap commission at amount', async () => {
      prisma.setting.findFirst.mockResolvedValue(null);
      const result = await service.calculateCommission(500, 'onsite');
      expect(result.commission).toBe(75);
      expect(result.netAmount).toBe(425);
    });
  });
});

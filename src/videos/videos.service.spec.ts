import { Test, TestingModule } from '@nestjs/testing';
import { VideosService } from './videos.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

jest.mock('src/utils/cloudinary', () => ({ uploadVideoToCloudinary: jest.fn().mockResolvedValue('https://video.url') }));

describe('VideosService', () => {
  let service: VideosService;
  let prisma: Record<string, any>;

  beforeEach(async () => {
    prisma = {
      user: { findUnique: jest.fn() },
      categoryVideo: { findUnique: jest.fn() },
      video: { create: jest.fn(), update: jest.fn(), findUnique: jest.fn(), findMany: jest.fn(), count: jest.fn() },
      $transaction: jest.fn((fns: any[]) => Promise.all(fns)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [VideosService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(VideosService);
  });

  describe('findAll', () => {
    it('should return paginated videos', async () => {
      prisma.$transaction.mockResolvedValue([[], 0]);
      const result = await service.findAll({});
      expect(result.items).toEqual([]);
    });
    it('should throw on invalid page', async () => {
      await expect(service.findAll({ page: 0, limit: 10 } as any)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findOne', () => {
    it('should throw if not found', async () => {
      prisma.video.findUnique.mockResolvedValue(null);
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
    it('should return video', async () => {
      prisma.video.findUnique.mockResolvedValue({ videoId: 1, category: {}, medecin: {} });
      const result = await service.findOne(1);
      expect(result.video).toBeDefined();
    });
  });

  describe('update', () => {
    it('should throw if not found', async () => {
      prisma.video.findUnique.mockResolvedValue(null);
      await expect(service.update(999, {} as any)).rejects.toThrow(NotFoundException);
    });
  });
});

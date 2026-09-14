import { Test, TestingModule } from '@nestjs/testing';
import { CategoryVideosService } from './category-videos.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';

jest.mock('src/utils/cloudinary', () => ({ uploadImageToCloudinary: jest.fn().mockResolvedValue('https://img.url') }));

describe('CategoryVideosService', () => {
  let service: CategoryVideosService;
  let prisma: Record<string, any>;

  beforeEach(async () => {
    prisma = {
      categoryVideo: { findUnique: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn(), count: jest.fn() },
      $transaction: jest.fn((fns: any[]) => Promise.all(fns)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [CategoryVideosService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(CategoryVideosService);
  });

  describe('findAll', () => {
    it('should return paginated categories', async () => {
      prisma.$transaction.mockResolvedValue([[], 0]);
      const result = await service.findAll({});
      expect(result.items).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should throw if not found', async () => {
      prisma.categoryVideo.findUnique.mockResolvedValue(null);
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should throw if duplicate name', async () => {
      prisma.categoryVideo.findUnique.mockResolvedValue({ categoryId: 1, name: 'X' });
      await expect(service.create({ name: 'X' } as any)).rejects.toThrow(ConflictException);
    });
    it('should create category', async () => {
      prisma.categoryVideo.findUnique.mockResolvedValue(null);
      prisma.categoryVideo.create.mockResolvedValue({ categoryId: 1, name: 'Cat', description: null, coverImage: null });
      const result = await service.create({ name: 'Cat' } as any);
      expect(result.item).toBeDefined();
    });
  });

  describe('remove', () => {
    it('should throw if not found', async () => {
      prisma.categoryVideo.findUnique.mockResolvedValue(null);
      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
    it('should throw if videos attached', async () => {
      prisma.categoryVideo.findUnique.mockResolvedValue({ categoryId: 1, _count: { videos: 5 } });
      await expect(service.remove(1)).rejects.toThrow(ConflictException);
    });
  });
});

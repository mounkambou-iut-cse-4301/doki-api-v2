import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesService } from './categories.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let prisma: Record<string, any>;

  beforeEach(async () => {
    prisma = {
      category: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn((fns: any[]) => Promise.all(fns)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [CategoriesService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(CategoriesService);
  });

  describe('findAll', () => {
    it('should return paginated categories', async () => {
      prisma.category.count.mockResolvedValue(0);
      prisma.category.findMany.mockResolvedValue([]);
      const result = await service.findAll({ page: 1, limit: 10 });
      expect(result.meta.total).toBe(0);
    });
  });

  describe('findOne', () => {
    it('should throw if not found', async () => {
      prisma.category.findUnique.mockResolvedValue(null);
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });

    it('should return category', async () => {
      prisma.category.findUnique.mockResolvedValue({ categoryId: 1, name: 'X' });
      const result = await service.findOne(1);
      expect(result.categoryId).toBe(1);
    });
  });

  describe('create', () => {
    it('should create a category', async () => {
      prisma.category.create.mockResolvedValue({ categoryId: 1, name: 'Test' });
      const result = await service.create({ name: 'Test', description: 'desc' });
      expect(result.name).toBe('Test');
    });
  });

  describe('update', () => {
    it('should throw if not found', async () => {
      prisma.category.findUnique.mockResolvedValue(null);
      await expect(service.update(999, { name: 'x' })).rejects.toThrow(NotFoundException);
    });

    it('should update category', async () => {
      prisma.category.findUnique.mockResolvedValue({ categoryId: 1 });
      prisma.category.update.mockResolvedValue({ categoryId: 1, name: 'Updated' });
      const result = await service.update(1, { name: 'Updated' });
      expect(result.name).toBe('Updated');
    });
  });
});

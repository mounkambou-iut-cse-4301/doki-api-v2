import { Test, TestingModule } from '@nestjs/testing';
import { FormationsService } from './formations.service';
import { PrismaService } from '../prisma/prisma.service';

describe('FormationsService', () => {
  let service: FormationsService;
  let prisma: Record<string, any>;

  beforeEach(async () => {
    prisma = {
      formationContinue: { findUnique: jest.fn(), findMany: jest.fn(), count: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
      lesson: { findMany: jest.fn(), create: jest.fn(), deleteMany: jest.fn() },
      category: { findUnique: jest.fn() },
      user: { findUnique: jest.fn() },
      speciality: { findUnique: jest.fn() },
      $transaction: jest.fn(async (fnOrArray: any) => {
        if (Array.isArray(fnOrArray)) return Promise.all(fnOrArray);
        return fnOrArray(prisma);
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [FormationsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(FormationsService);
  });

  describe('findAll', () => {
    it('should return paginated formations', async () => {
      prisma.formationContinue.findMany.mockResolvedValue([]);
      prisma.formationContinue.count.mockResolvedValue(0);
      const result = await service.findAll({ page: 1, limit: 10 });
      expect(result).toBeDefined();
      expect(result.data).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should throw if not found', async () => {
      prisma.formationContinue.findUnique.mockResolvedValue(null);
      await expect(service.findOne(999)).rejects.toThrow();
    });
    it('should return formation', async () => {
      prisma.formationContinue.findUnique.mockResolvedValue({ formationId: 1, lessons: [] });
      const result = await service.findOne(1);
      expect(result).toBeDefined();
    });
  });

  describe('create', () => {
    it('should create formation', async () => {
      prisma.user.findUnique.mockResolvedValue({ userId: 1 });
      prisma.category.findUnique.mockResolvedValue(null);
      prisma.formationContinue.create.mockResolvedValue({ formationId: 1 });
      prisma.lesson.create.mockResolvedValue({});
      const result = await service.create({ title: 'Test', medecinId: 1, lessons: [{ title: 'Lesson', content: 'text' }] } as any);
      expect(result).toBeDefined();
    });
  });

  describe('update', () => {
    it('should throw if not found', async () => {
      prisma.formationContinue.findUnique.mockResolvedValue(null);
      await expect(service.update(999, {} as any)).rejects.toThrow();
    });
  });
});

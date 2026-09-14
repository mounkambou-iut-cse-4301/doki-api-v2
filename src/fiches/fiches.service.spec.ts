import { Test, TestingModule } from '@nestjs/testing';
import { FichesService } from './fiches.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('FichesService', () => {
  let service: FichesService;
  let prisma: Record<string, any>;

  beforeEach(async () => {
    prisma = {
      fiche: { findUnique: jest.fn(), findMany: jest.fn(), count: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
      ficheResponse: { findMany: jest.fn(), count: jest.fn(), create: jest.fn(), findUnique: jest.fn() },
      user: { findUnique: jest.fn() },
      $transaction: jest.fn((fns: any[]) => Promise.all(fns)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [FichesService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(FichesService);
  });

  describe('createFiche', () => {
    it('should create fiche', async () => {
      prisma.fiche.create.mockResolvedValue({ ficheId: 1, title: 'Test', questions: [] });
      const result = await service.createFiche({ title: 'Test', questions: [] } as any);
      expect(result).toBeDefined();
    });
  });

  describe('listFiches', () => {
    it('should return paginated fiches', async () => {
      prisma.fiche.findMany.mockResolvedValue([]);
      prisma.fiche.count.mockResolvedValue(0);
      const result = await service.listFiches({});
      expect(result).toBeDefined();
    });
  });

  describe('getFiche', () => {
    it('should throw if not found', async () => {
      prisma.fiche.findUnique.mockResolvedValue(null);
      await expect(service.getFiche(999)).rejects.toThrow(NotFoundException);
    });
    it('should return fiche', async () => {
      prisma.fiche.findUnique.mockResolvedValue({ ficheId: 1, title: 'Test', questions: '[]', responses: [] });
      const result = await service.getFiche(1);
      expect(result).toBeDefined();
    });
  });

  describe('deleteFiche', () => {
    it('should throw if not found', async () => {
      prisma.fiche.findUnique.mockResolvedValue(null);
      await expect(service.deleteFiche(999)).rejects.toThrow(NotFoundException);
    });
    it('should delete fiche', async () => {
      prisma.fiche.findUnique.mockResolvedValue({ ficheId: 1 });
      prisma.ficheResponse.count.mockResolvedValue(0);
      prisma.fiche.delete.mockResolvedValue({ ficheId: 1 });
      const result = await service.deleteFiche(1);
      expect(result).toBeDefined();
    });
  });
});

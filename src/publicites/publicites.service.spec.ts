import { Test, TestingModule } from '@nestjs/testing';
import { PublicitesService } from './publicites.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

jest.mock('src/utils/cloudinary', () => ({ uploadImageToCloudinary: jest.fn().mockResolvedValue('https://img.url'), uploadVideoToCloudinary: jest.fn().mockResolvedValue('https://video.url') }));
jest.mock('sharp', () => ({ __esModule: true, default: jest.fn(() => ({ jpeg: jest.fn().mockReturnThis(), toBuffer: jest.fn().mockResolvedValue(Buffer.from('compressed')) })), }));

describe('PublicitesService', () => {
  let service: PublicitesService;
  let prisma: Record<string, any>;

  beforeEach(async () => {
    prisma = {
      packagePublicite: { findUnique: jest.fn(), findMany: jest.fn(), count: jest.fn(), create: jest.fn(), update: jest.fn() },
      publicite: { findUnique: jest.fn(), findMany: jest.fn(), count: jest.fn(), create: jest.fn(), update: jest.fn() },
      mediaPublicite: { deleteMany: jest.fn(), create: jest.fn() },
      user: { findUnique: jest.fn() },
      transaction: { findUnique: jest.fn(), update: jest.fn() },
      $transaction: jest.fn((fns: any[]) => Promise.all(fns)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [PublicitesService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(PublicitesService);
  });

  describe('createPackage', () => {
    it('should throw if video duration > 30s', async () => {
      await expect(service.createPackage({ nom: 'Test', dureeMaxVideoSecondes: 35, nombreMaxImages: 1, nombreMaxVideos: 0, montant: 1000, dureeJours: 7, cibleAudience: 'MEDECIN' } as any)).rejects.toThrow(BadRequestException);
    });
    it('should throw if no images and no videos', async () => {
      await expect(service.createPackage({ nom: 'Test', dureeMaxVideoSecondes: 10, nombreMaxImages: 0, nombreMaxVideos: 0, montant: 1000, dureeJours: 7, cibleAudience: 'MEDECIN' } as any)).rejects.toThrow(BadRequestException);
    });
  });

  describe('getOnePackage', () => {
    it('should throw if not found', async () => {
      prisma.packagePublicite.findUnique.mockResolvedValue(null);
      await expect(service.getOnePackage(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOne', () => {
    it('should throw if not found', async () => {
      prisma.publicite.findUnique.mockResolvedValue(null);
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('cancel', () => {
    it('should throw if not found', async () => {
      prisma.publicite.findUnique.mockResolvedValue(null);
      await expect(service.cancel(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('terminate', () => {
    it('should throw if not found', async () => {
      prisma.publicite.findUnique.mockResolvedValue(null);
      await expect(service.terminate(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return paginated publicites', async () => {
      prisma.publicite.findMany.mockResolvedValue([]);
      prisma.publicite.count.mockResolvedValue(0);
      const result = await service.findAll({});
      expect(result.data).toEqual([]);
    });
  });

  describe('getAllPackages', () => {
    it('should return paginated packages', async () => {
      prisma.packagePublicite.findMany.mockResolvedValue([]);
      prisma.packagePublicite.count.mockResolvedValue(0);
      const result = await service.getAllPackages({});
      expect(result.data).toEqual([]);
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { PermissionsService } from './permissions.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('PermissionsService', () => {
  let service: PermissionsService;
  let prisma: Record<string, any>;

  beforeEach(async () => {
    prisma = {
      permission: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
      $transaction: jest.fn((fns: any[]) => Promise.all(fns)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [PermissionsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(PermissionsService);
  });

  describe('findAll', () => {
    it('should return paginated permissions', async () => {
      prisma.permission.findMany.mockResolvedValue([{ permissionId: 1, name: 'VIEW' }]);
      prisma.permission.count.mockResolvedValue(1);
      const result = await service.findAll({});
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });

    it('should filter by name', async () => {
      prisma.permission.findMany.mockResolvedValue([]);
      prisma.permission.count.mockResolvedValue(0);
      await service.findAll({ name: 'VIEW' });
      expect(prisma.permission.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ name: expect.any(Object) }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should throw if not found', async () => {
      prisma.permission.findUnique.mockResolvedValue(null);
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });

    it('should return permission', async () => {
      prisma.permission.findUnique.mockResolvedValue({ permissionId: 1, name: 'X' });
      const result = await service.findOne(1);
      expect(result.permissionId).toBe(1);
    });
  });
});

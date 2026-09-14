import { Test, TestingModule } from '@nestjs/testing';
import { RolePermissionsService } from './role-permissions.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('RolePermissionsService', () => {
  let service: RolePermissionsService;
  let prisma: Record<string, any>;

  beforeEach(async () => {
    prisma = {
      role: { findUnique: jest.fn() },
      permission: { findMany: jest.fn() },
      rolePermission: {
        createMany: jest.fn(),
        deleteMany: jest.fn(),
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [RolePermissionsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(RolePermissionsService);
  });

  describe('assign', () => {
    it('should throw if role not found', async () => {
      prisma.role.findUnique.mockResolvedValue(null);
      await expect(service.assign({ roleId: 999, permissionIds: [1] })).rejects.toThrow(NotFoundException);
    });

    it('should throw if permissions not found', async () => {
      prisma.role.findUnique.mockResolvedValue({ roleId: 1 });
      prisma.permission.findMany.mockResolvedValue([]);
      await expect(service.assign({ roleId: 1, permissionIds: [1, 2] })).rejects.toThrow(BadRequestException);
    });

    it('should assign permissions', async () => {
      prisma.role.findUnique.mockResolvedValue({ roleId: 1 });
      prisma.permission.findMany.mockResolvedValue([{ permissionId: 1 }]);
      prisma.rolePermission.createMany.mockResolvedValue({ count: 1 });
      prisma.rolePermission.findMany.mockResolvedValue([]);
      const result = await service.assign({ roleId: 1, permissionIds: [1] });
      expect(result).toBeDefined();
    });
  });

  describe('remove', () => {
    it('should throw if role not found', async () => {
      prisma.role.findUnique.mockResolvedValue(null);
      await expect(service.remove({ roleId: 999, permissionIds: [1] })).rejects.toThrow(NotFoundException);
    });

    it('should remove permissions', async () => {
      prisma.role.findUnique.mockResolvedValue({ roleId: 1 });
      prisma.rolePermission.deleteMany.mockResolvedValue({ count: 1 });
      prisma.rolePermission.findMany.mockResolvedValue([]);
      const result = await service.remove({ roleId: 1, permissionIds: [1] });
      expect(result).toBeDefined();
    });
  });

  describe('listByRole', () => {
    it('should throw if role not found', async () => {
      prisma.role.findUnique.mockResolvedValue(null);
      await expect(service.listByRole(999)).rejects.toThrow(NotFoundException);
    });
  });
});

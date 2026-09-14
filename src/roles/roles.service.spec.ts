import { Test, TestingModule } from '@nestjs/testing';
import { RolesService } from './roles.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('RolesService', () => {
  let service: RolesService;
  let prisma: Record<string, any>;

  beforeEach(async () => {
    prisma = {
      role: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      userRole: { count: jest.fn() },
      rolePermission: { count: jest.fn() },
      $transaction: jest.fn((fns: any[]) => Promise.all(fns)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [RolesService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(RolesService);
  });

  describe('normalizeRoleName', () => {
    it('should normalize accents, spaces, and uppercase', async () => {
      prisma.role.findUnique.mockResolvedValue(null);
      prisma.role.create.mockResolvedValue({ roleId: 1, name: 'MANAGE_PATIENT' });
      const result = await service.create({ name: 'månagé-patient' });
      expect(prisma.role.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ name: 'MANAGE_PATIENT' }) }),
      );
    });

    it('should throw on empty name', async () => {
      await expect(service.create({ name: '   ' })).rejects.toThrow(BadRequestException);
    });
  });

  describe('create', () => {
    it('should throw if role already exists', async () => {
      prisma.role.findUnique.mockResolvedValue({ roleId: 1, name: 'ADMIN' });
      await expect(service.create({ name: 'ADMIN' })).rejects.toThrow(BadRequestException);
    });

    it('should create a role', async () => {
      prisma.role.findUnique.mockResolvedValue(null);
      prisma.role.create.mockResolvedValue({ roleId: 1, name: 'ADMIN', description: null });
      const result = await service.create({ name: 'admin' });
      expect(result.name).toBe('ADMIN');
    });
  });

  describe('findAll', () => {
    it('should return all roles ordered by name', async () => {
      prisma.role.findMany.mockResolvedValue([{ roleId: 1, name: 'A' }, { roleId: 2, name: 'B' }]);
      const result = await service.findAll();
      expect(result).toHaveLength(2);
      expect(prisma.role.findMany).toHaveBeenCalledWith({ orderBy: { name: 'asc' } });
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException if role not found', async () => {
      prisma.role.findUnique.mockResolvedValue(null);
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });

    it('should return role if found', async () => {
      prisma.role.findUnique.mockResolvedValue({ roleId: 1, name: 'ADMIN' });
      const result = await service.findOne(1);
      expect(result.roleId).toBe(1);
    });
  });

  describe('update', () => {
    it('should update role name and description', async () => {
      prisma.role.findUnique.mockResolvedValue({ roleId: 1, name: 'OLD' });
      prisma.role.findFirst.mockResolvedValue(null);
      prisma.role.update.mockResolvedValue({ roleId: 1, name: 'NEW', description: 'desc' });
      const result = await service.update(1, { name: 'new', description: 'desc' });
      expect(result.name).toBe('NEW');
    });

    it('should throw if duplicate name on update', async () => {
      prisma.role.findUnique.mockResolvedValue({ roleId: 1, name: 'OLD' });
      prisma.role.findFirst.mockResolvedValue({ roleId: 2, name: 'TAKEN' });
      await expect(service.update(1, { name: 'taken' })).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('should throw if role is referenced', async () => {
      prisma.role.findUnique.mockResolvedValue({ roleId: 1, name: 'X' });
      prisma.userRole.count.mockResolvedValue(1);
      prisma.rolePermission.count.mockResolvedValue(0);
      await expect(service.remove(1)).rejects.toThrow(BadRequestException);
    });

    it('should delete role if not referenced', async () => {
      prisma.role.findUnique.mockResolvedValue({ roleId: 1, name: 'X' });
      prisma.userRole.count.mockResolvedValue(0);
      prisma.rolePermission.count.mockResolvedValue(0);
      prisma.role.delete.mockResolvedValue({ roleId: 1 });
      const result = await service.remove(1);
      expect(result.roleId).toBe(1);
    });
  });
});

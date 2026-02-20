import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  private normalizeRoleName(name: string): string {
    if (!name) return '';
    return name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // supprime les accents
      .replace(/[^A-Za-z0-9]+/g, '_')  // espaces, tirets -> underscore
      .replace(/^_+|_+$/g, '')         // supprime underscores début/fin
      .toUpperCase();
  }

  async create(dto: CreateRoleDto) {
    const normalized = this.normalizeRoleName(dto.name);

    if (!normalized) {
      throw new BadRequestException({
        message: 'Le nom du rôle est requis',
        messageE: 'Role name is required',
      });
    }

    const exists = await this.prisma.role.findUnique({
      where: { name: normalized },
    });

    if (exists) {
      throw new BadRequestException({
        message: 'Ce rôle existe déjà',
        messageE: 'This role already exists',
      });
    }

    return this.prisma.role.create({
      data: {
        name: normalized,
        description: dto.description ?? null,
      },
    });
  }

  async findAll() {
    return this.prisma.role.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findOne(roleId: number) {
    const role = await this.prisma.role.findUnique({
      where: { roleId },
    });

    if (!role) {
      throw new NotFoundException({
        message: 'Rôle introuvable',
        messageE: 'Role not found',
      });
    }

    return role;
  }

  async update(roleId: number, dto: UpdateRoleDto) {
    await this.findOne(roleId);

    const data: { name?: string; description?: string | null } = {};

    if (dto.name !== undefined) {
      const normalized = this.normalizeRoleName(dto.name);

      if (!normalized) {
        throw new BadRequestException({
          message: 'Le nom du rôle est invalide',
          messageE: 'Invalid role name',
        });
      }

      const duplicate = await this.prisma.role.findFirst({
        where: {
          name: normalized,
          NOT: { roleId },
        },
      });

      if (duplicate) {
        throw new BadRequestException({
          message: 'Un autre rôle porte déjà ce nom',
          messageE: 'Another role already uses this name',
        });
      }

      data.name = normalized;
    }

    if (dto.description !== undefined) {
      data.description = dto.description;
    }

    return this.prisma.role.update({
      where: { roleId },
      data,
    });
  }

  async remove(roleId: number) {
    await this.findOne(roleId);

    const [userRoleCount, rolePermissionCount] = await this.prisma.$transaction([
      this.prisma.userRole.count({ where: { roleId } }),
      this.prisma.rolePermission.count({ where: { roleId } }),
    ]);

    if (userRoleCount > 0 || rolePermissionCount > 0) {
      throw new BadRequestException({
        message:
          'Suppression impossible : ce rôle est déjà référencé (UserRole / RolePermission).',
        messageE:
          'Delete not allowed: this role is referenced by foreign keys (UserRole / RolePermission).',
      });
    }

    return this.prisma.role.delete({
      where: { roleId },
    });
  }
}
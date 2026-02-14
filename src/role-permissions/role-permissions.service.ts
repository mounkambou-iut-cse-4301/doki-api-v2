import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AssignRolePermissionsDto } from './dto/assign-role-permissions.dto';
import { RemoveRolePermissionsDto } from './dto/remove-role-permissions.dto';

@Injectable()
export class RolePermissionsService {
  constructor(private readonly prisma: PrismaService) {}

  private async getRoleOrThrow(roleId: number) {
    const role = await this.prisma.role.findUnique({ where: { roleId } });
    if (!role) {
      throw new NotFoundException({
        message: 'Rôle introuvable.',
        messageE: 'Role not found.',
      });
    }
    return role;
  }

  async assign(dto: AssignRolePermissionsDto) {
    await this.getRoleOrThrow(dto.roleId);

    const ids = dto.permissionIds.map(Number).filter(Boolean);
    const perms = await this.prisma.permission.findMany({
      where: { permissionId: { in: ids } },
      select: { permissionId: true },
    });

    const found = new Set(perms.map(p => p.permissionId));
    const missing = ids.filter(x => !found.has(x));
    if (missing.length) {
      throw new BadRequestException({
        message: `Permissions introuvables: ${missing.join(', ')}`,
        messageE: `Permissions not found: ${missing.join(', ')}`,
      });
    }

    await this.prisma.rolePermission.createMany({
      data: ids.map(permissionId => ({
        roleId: dto.roleId,
        permissionId,
      })),
      skipDuplicates: true,
    });

    return this.listByRole(dto.roleId);
  }

  async remove(dto: RemoveRolePermissionsDto) {
    await this.getRoleOrThrow(dto.roleId);

    const ids = dto.permissionIds.map(Number).filter(Boolean);

    await this.prisma.rolePermission.deleteMany({
      where: {
        roleId: dto.roleId,
        permissionId: { in: ids },
      },
    });

    return this.listByRole(dto.roleId);
  }

  async listByRole(roleId: number) {
    await this.getRoleOrThrow(roleId);

    const rows = await this.prisma.rolePermission.findMany({
      where: { roleId },
      orderBy: { assignedAt: 'desc' },
      include: { permission: true },
    });

    return {
      roleId,
      permissions: rows.map(r => r.permission),
      meta: { total: rows.length },
    };
  }
}

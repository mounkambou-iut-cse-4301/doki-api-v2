import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  private normalizeRoleName(name: string): string {
    if (!name) return '';
    return name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // supprime les accents
      .replace(/[^A-Za-z0-9]+/g, '_')  // espaces, tirets -> underscore
      .toUpperCase();
  }

  async create(dto: CreateRoleDto) {
    const normalized = this.normalizeRoleName(dto.name);
    if (!normalized) {
      throw new BadRequestException({ message: 'Le nom du rôle est requis' ,messageE: 'Role name is required' });
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
}

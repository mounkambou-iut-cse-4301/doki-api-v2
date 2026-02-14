import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

import { GetPermissionsQueryDto } from './dto/get-permissions-query.dto';

@Injectable()
export class PermissionsService {
  constructor(private readonly prisma: PrismaService) {}

  // ✅ Normalisation: MAJUSCULE + sans accents + séparateurs => underscore
  private normalizeName(name: string): string {
    if (!name) return '';
    return String(name)
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')  // supprime les accents
      .replace(/[^A-Za-z0-9]+/g, '_')   // espaces/tirets => underscore
      .replace(/^_+|_+$/g, '')          // trim underscores
      .toUpperCase();
  }

  private buildWhere(query: GetPermissionsQueryDto) {
    const where: any = {};

    // name filter (normalisé)
    if (query.name) {
      const n = this.normalizeName(query.name);
      // contains pour permettre filtre partiel
      where.name = { contains: n };
    }

    // search sur name et description
    if (query.search) {
      const sRaw = String(query.search).trim();
      const sName = this.normalizeName(sRaw);

      where.OR = [
        { name: { contains: sName } },
        { description: { contains: sRaw } },
      ];
    }

    return where;
  }

 

  async findAll(query: GetPermissionsQueryDto) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 50;
    const skip = (page - 1) * limit;

    const where = this.buildWhere(query);

    const [data, total] = await this.prisma.$transaction([
      this.prisma.permission.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      this.prisma.permission.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        pageCount: Math.ceil(total / limit),
      },
    };
  }

  async findOne(permissionId: number) {
    const perm = await this.prisma.permission.findUnique({
      where: { permissionId },
    });

    if (!perm) {
      throw new NotFoundException({
        message: 'Permission introuvable.',
        messageE: 'Permission not found.',
      });
    }

    return perm;
  }


}

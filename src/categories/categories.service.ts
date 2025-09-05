import { Injectable, NotFoundException } from '@nestjs/common';
// ⚠️ importe Prisma depuis TON output généré
import { Prisma } from '../../generated/prisma';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

type CategoryListFilters = {
  search?: string;
  createdFrom?: string;
  createdTo?: string;
  page: number;
  limit: number;
};

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: CategoryListFilters) {
    const { page, limit, search, createdFrom, createdTo } = query;

    const where: Prisma.CategoryWhereInput = {
      AND: [
        search
          ? {
              OR: [
                { name: { contains: search } },
                { description: { contains: search } },
              ],
            }
          : {},
        createdFrom ? { createdAt: { gte: new Date(createdFrom) } } : {},
        createdTo ? { createdAt: { lte: new Date(createdTo) } } : {},
      ],
    };

    const [total, data] = await this.prisma.$transaction([
      this.prisma.category.count({ where }),
      this.prisma.category.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
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

  async findOne(id: number) {
    const item = await this.prisma.category.findUnique({
      where: { categoryId: id },
    });
    if (!item) throw new NotFoundException('Category not found');
    return item;
  }

  async create(dto: CreateCategoryDto) {
    return this.prisma.category.create({
      data: {
        name: dto.name,
        description: dto.description,
      },
    });
  }

  async update(id: number, dto: UpdateCategoryDto) {
    await this.ensureExists(id);
    return this.prisma.category.update({
      where: { categoryId: id },
      data: {
        name: dto.name,
        description: dto.description,
      },
    });
  }

  private async ensureExists(id: number) {
    const exists = await this.prisma.category.findUnique({
      where: { categoryId: id },
      select: { categoryId: true },
    });
    if (!exists) throw new NotFoundException('Category not found');
  }
}

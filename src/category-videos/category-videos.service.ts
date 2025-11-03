import { BadRequestException, Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCategoryVideoDto } from './dto/create-category-video.dto';
import { UpdateCategoryVideoDto } from './dto/update-category-video.dto';
import { QueryCategoryVideoDto } from './dto/query-category-video.dto';

@Injectable()
export class CategoryVideosService {
  constructor(private readonly prisma: PrismaService) {}

  /** CREATE */
  async create(dto: CreateCategoryVideoDto) {
    // contrainte d’unicité sur name
    const exists = await this.prisma.categoryVideo.findUnique({ where: { name: dto.name } });
    if (exists) {
      throw new ConflictException({
        message: `La catégorie "${dto.name}" existe déjà.`,
        messageE: `Category "${dto.name}" already exists.`,
      });
    }

    const item = await this.prisma.categoryVideo.create({
      data: {
        name: dto.name.trim(),
        description: dto.description,
      },
    });

    return {
      message: 'Catégorie créée.',
      messageE: 'Category created.',
      item,
    };
  }

  /** UPDATE */
  async update(id: number, dto: UpdateCategoryVideoDto) {
    const found = await this.prisma.categoryVideo.findUnique({ where: { categoryId: id } });
    if (!found) {
      throw new NotFoundException({
        message: `Catégorie ${id} introuvable.`,
        messageE: `Category ${id} not found.`,
      });
    }

    if (dto.name && dto.name !== found.name) {
      const dup = await this.prisma.categoryVideo.findUnique({ where: { name: dto.name } });
      if (dup) {
        throw new ConflictException({
          message: `La catégorie "${dto.name}" existe déjà.`,
          messageE: `Category "${dto.name}" already exists.`,
        });
      }
    }

    const item = await this.prisma.categoryVideo.update({
      where: { categoryId: id },
      data: {
        name: dto.name?.trim(),
        description: dto.description,
      },
    });

    return {
      message: 'Catégorie mise à jour.',
      messageE: 'Category updated.',
      item,
    };
  }

  /** LIST (pagination + recherche) */
  async findAll(query: QueryCategoryVideoDto) {
    const page  = query.page  != null ? Number(query.page)  : 1;
    const limit = query.limit != null ? Number(query.limit) : 10;
    if (page < 1 || limit < 1) {
      throw new BadRequestException({
        message: 'Page et limit doivent être >= 1.',
        messageE: 'Page and limit must be >= 1.',
      });
    }
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.q && query.q.trim()) {
      const q = query.q.trim();
      where.OR = [
        { name:        { contains: q } },
        { description: { contains: q } },
      ];
    }

    // items + total + count vidéos par catégorie
    const [items, total] = await this.prisma.$transaction([
      this.prisma.categoryVideo.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          _count: { select: { videos: true } },
        },
      }),
      this.prisma.categoryVideo.count({ where }),
    ]);

    return {
      message: 'Catégories récupérées.',
      messageE: 'Categories fetched.',
      items: items.map((c) => ({
        categoryId: c.categoryId,
        name: c.name,
        description: c.description,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        videosCount: c._count.videos,
      })),
      meta: { total, page, limit, lastPage: Math.ceil(total / limit) },
    };
  }

  /** GET ONE */
  async findOne(id: number) {
    const item = await this.prisma.categoryVideo.findUnique({
      where: { categoryId: id },
      include: {
        _count: { select: { videos: true } },
      },
    });
    if (!item) {
      throw new NotFoundException({
        message: `Catégorie ${id} introuvable.`,
        messageE: `Category ${id} not found.`,
      });
    }
    return {
      message: 'Catégorie récupérée.',
      messageE: 'Category fetched.',
      item: {
        categoryId: item.categoryId,
        name: item.name,
        description: item.description,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        videosCount: item._count.videos,
      },
    };
  }

  /** DELETE (protégé si vidéos rattachées) */
  async remove(id: number) {
    const item = await this.prisma.categoryVideo.findUnique({
      where: { categoryId: id },
      include: { _count: { select: { videos: true } } },
    });
    if (!item) {
      throw new NotFoundException({
        message: `Catégorie ${id} introuvable.`,
        messageE: `Category ${id} not found.`,
      });
    }

    if (item._count.videos > 0) {
      throw new ConflictException({
        message: `Suppression impossible : ${item._count.videos} vidéo(s) rattachée(s) à cette catégorie.`,
        messageE: `Cannot delete: ${item._count.videos} video(s) linked to this category.`,
      });
    }

    await this.prisma.categoryVideo.delete({ where: { categoryId: id } });

    return {
      message: 'Catégorie supprimée.',
      messageE: 'Category deleted.',
    };
  }
}

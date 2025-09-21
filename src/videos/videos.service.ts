import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateVideoDto } from './dto/create-video.dto';
import { UpdateVideoDto } from './dto/update-video.dto';
import { QueryVideoDto } from './dto/query-video.dto';

// Helpers pour gérer la journée entière en Africa/Douala
function dayRangeInTZ(yyyyMmDd: string, tz = 'Africa/Douala') {
  const [y, m, d] = yyyyMmDd.split('-').map(Number);
  const startLocal = new Date(Date.UTC(y, m - 1, d, 0, 0, 0));
  const endLocal = new Date(Date.UTC(y, m - 1, d + 1, 0, 0, 0));
  return { gte: startLocal, lt: endLocal };
}

@Injectable()
export class VideosService {
  constructor(private readonly prisma: PrismaService) {}

  /** 1) Créer une vidéo */
  async create(dto: CreateVideoDto) {
    try {
      // Vérifier le médecin
      const med = await this.prisma.user.findUnique({ where: { userId: dto.medecinId } });
      if (!med || med.userType !== 'MEDECIN') {
        throw new NotFoundException({
          message: `Médecin d'ID ${dto.medecinId} introuvable.`,
          messageE: `Doctor with ID ${dto.medecinId} not found.`,
        });
      }

      const video = await this.prisma.video.create({
        data: {
          title: dto.title,
          path: dto.path,
          description: dto.description,
          category: dto.category,
          medecinId: dto.medecinId,
        },
      });

      return {
        message: 'Vidéo créée avec succès.',
        messageE: 'Video created successfully.',
        video,
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException({
        message: `Erreur lors de la création : ${error.message}`,
        messageE: `Error while creating: ${error.message}`,
      });
    }
  }

  /** 2) Mettre à jour une vidéo */
  async update(id: number, dto: UpdateVideoDto) {
    try {
      const existing = await this.prisma.video.findUnique({ where: { videoId: id } });
      if (!existing) {
        throw new NotFoundException({
          message: `Vidéo ${id} introuvable.`,
          messageE: `Video ${id} not found.`,
        });
      }

      if (dto.medecinId) {
        const med = await this.prisma.user.findUnique({ where: { userId: dto.medecinId } });
        if (!med || med.userType !== 'MEDECIN') {
          throw new NotFoundException({
            message: `Médecin d'ID ${dto.medecinId} introuvable.`,
            messageE: `Doctor with ID ${dto.medecinId} not found.`,
          });
        }
      }

      const video = await this.prisma.video.update({
        where: { videoId: id },
        data: {
          title: dto.title,
          path: dto.path,
          description: dto.description,
          category: dto.category,
          medecinId: dto.medecinId,
        },
      });

      return {
        message: 'Vidéo mise à jour avec succès.',
        messageE: 'Video updated successfully.',
        video,
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException({
        message: `Erreur lors de la mise à jour : ${error.message}`,
        messageE: `Error while updating: ${error.message}`,
      });
    }
  }

  /** 3) Liste paginée + filtres (medecinId, category, date) */
  async findAll(query: QueryVideoDto) {
    try {
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
      if (query.medecinId) where.medecinId = Number(query.medecinId);
      if (query.category)  where.category  = { equals: query.category, mode: 'insensitive' };
      if (query.date)      where.createdAt = dayRangeInTZ(query.date);
      if (query.q && query.q.trim()) {
  const q = query.q.trim();
  where.OR = [
    { title:       { contains: q } },
    { description: { contains: q } },
    { category:    { contains: q } },
  ];
}


      const [items, total] = await this.prisma.$transaction([
        this.prisma.video.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          select: {
            videoId: true,
            title: true,
            path: true,
            description: true,
            category: true,
            medecinId: true,
            createdAt: true,
          },
        }),
        this.prisma.video.count({ where }),
      ]);

      return {
        message: 'Vidéos récupérées.',
        messageE: 'Videos fetched.',
        items,
        meta: { total, page, limit, lastPage: Math.ceil(total / limit) },
      };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException({
        message: `Erreur lors de la récupération : ${error.message}`,
        messageE: `Error while fetching: ${error.message}`,
      });
    }
  }

  /** 4) Détail vidéo + données du médecin */
  async findOne(id: number) {
    try {
      const video = await this.prisma.video.findUnique({
        where: { videoId: id },
        include: {
          medecin: true,
        },
      });
      if (!video) {
        throw new NotFoundException({
          message: `Vidéo ${id} introuvable.`,
          messageE: `Video ${id} not found.`,
        });
      }
      return {
        message: 'Vidéo récupérée.',
        messageE: 'Video fetched.',
        video,
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException({
        message: `Erreur lors de la récupération : ${error.message}`,
        messageE: `Error while fetching: ${error.message}`,
      });
    }
  }
}
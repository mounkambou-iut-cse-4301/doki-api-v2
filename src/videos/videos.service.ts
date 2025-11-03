import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateVideoDto } from './dto/create-video.dto';
import { UpdateVideoDto } from './dto/update-video.dto';
import { QueryVideoDto } from './dto/query-video.dto';
import { uploadVideoToCloudinary } from 'src/utils/cloudinary';

// Journée entière UTC
function dayRangeUTC(yyyyMmDd: string) {
  const [y, m, d] = yyyyMmDd.split('-').map(Number);
  const gte = new Date(Date.UTC(y, m - 1, d, 0, 0, 0));
  const lt  = new Date(Date.UTC(y, m - 1, d + 1, 0, 0, 0));
  return { gte, lt };
}

@Injectable()
export class VideosService {
  constructor(private readonly prisma: PrismaService) {}

  /* CREATE */
  async create(dto: CreateVideoDto) {
    try {
      // 1) Vérif médecin
      const med = await this.prisma.user.findUnique({ where: { userId: dto.medecinId } });
      // if (!med || med.userType !== 'MEDECIN') {
      //   throw new NotFoundException({
      //     message: `Médecin d'ID ${dto.medecinId} introuvable.`,
      //     messageE: `Doctor with ID ${dto.medecinId} not found.`,
      //   });
      // }

      // 2) Vérif catégorie (si fournie)
      if (dto.categoryVideoId != null) {
        const cat = await this.prisma.categoryVideo.findUnique({ where: { categoryId: dto.categoryVideoId } });
        if (!cat) {
          throw new NotFoundException({
            message: `Catégorie ${dto.categoryVideoId} introuvable.`,
            messageE: `Category ${dto.categoryVideoId} not found.`,
          });
        }
      }

      // 3) Upload (ou réutilisation URL)
      const uploadedUrl = await uploadVideoToCloudinary(dto.path, `videos/medecin_${dto.medecinId}`);

      // 4) Create
      const video = await this.prisma.video.create({
        data: {
          title: dto.title,
          path: uploadedUrl,
          description: dto.description,
          categoryId: dto.categoryVideoId ?? null,
          medecinId: dto.medecinId,
        },
        include: {
          // ✅ nom de relation correct
          category: { select: { categoryId: true, name: true } },
          medecin:  { select: { userId: true, firstName: true, lastName: true } },
        },
      });

      return {
        message: 'Vidéo créée avec succès.',
        messageE: 'Video created successfully.',
        video,
      };
    } catch (error: any) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException({
        message: `Erreur lors de la création : ${error.message}`,
        messageE: `Error while creating: ${error.message}`,
      });
    }
  }

  /* UPDATE */
  async update(id: number, dto: UpdateVideoDto) {
    try {
      const existing = await this.prisma.video.findUnique({ where: { videoId: id } });
      if (!existing) {
        throw new NotFoundException({
          message: `Vidéo ${id} introuvable.`,
          messageE: `Video ${id} not found.`,
        });
      }

      if (dto.medecinId != null) {
        const med = await this.prisma.user.findUnique({ where: { userId: dto.medecinId } });
        if (!med || med.userType !== 'MEDECIN') {
          throw new NotFoundException({
            message: `Médecin d'ID ${dto.medecinId} introuvable.`,
            messageE: `Doctor with ID ${dto.medecinId} not found.`,
          });
        }
      }

      if (dto.categoryVideoId != null) {
        const cat = await this.prisma.categoryVideo.findUnique({ where: { categoryId: dto.categoryVideoId } });
        if (!cat) {
          throw new NotFoundException({
            message: `Catégorie ${dto.categoryVideoId} introuvable.`,
            messageE: `Category ${dto.categoryVideoId} not found.`,
          });
        }
      }

      // Upload uniquement si un nouveau path est fourni
      let nextPath = existing.path;
      if (typeof dto.path === 'string' && dto.path.trim()) {
        nextPath = await uploadVideoToCloudinary(dto.path, `videos/medecin_${dto.medecinId ?? existing.medecinId}`);
      }

      const video = await this.prisma.video.update({
        where: { videoId: id },
        data: {
          title: dto.title ?? existing.title,
          path: nextPath,
          description: dto.description ?? existing.description,
          medecinId: dto.medecinId ?? existing.medecinId,
          categoryId: dto.categoryVideoId ?? existing.categoryId ?? null,
        },
        include: {
          category: { select: { categoryId: true, name: true } },
          medecin:  { select: { userId: true, firstName: true, lastName: true } },
        },
      });

      return {
        message: 'Vidéo mise à jour avec succès.',
        messageE: 'Video updated successfully.',
        video,
      };
    } catch (error: any) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException({
        message: `Erreur lors de la mise à jour : ${error.message}`,
        messageE: `Error while updating: ${error.message}`,
      });
    }
  }

  /* LIST + filtres */
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
      if (query.categoryId) where.categoryId = Number(query.categoryId);
      if (query.date) where.createdAt = dayRangeUTC(query.date);
      if (query.q && query.q.trim()) {
        const q = query.q.trim();
        where.OR = [
          { title:       { contains: q } },
          { description: { contains: q } },
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
            medecinId: true,
            categoryId: true,
            createdAt: true,
            category: { select: { categoryId: true, name: true } },
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
    } catch (error: any) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException({
        message: `Erreur lors de la récupération : ${error.message}`,
        messageE: `Error while fetching: ${error.message}`,
      });
    }
  }

  /* DETAIL */
  async findOne(id: number) {
    try {
      const video = await this.prisma.video.findUnique({
        where: { videoId: id },
        include: {
          category: true,
          medecin:  true,
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
    } catch (error: any) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException({
        message: `Erreur lors de la récupération : ${error.message}`,
        messageE: `Error while fetching: ${error.message}`,
      });
    }
  }
}

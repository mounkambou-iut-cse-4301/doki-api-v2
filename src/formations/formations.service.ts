import { Injectable, NotFoundException } from '@nestjs/common';
// ⚠️ Prisma import depuis ton client généré :
import { Prisma } from '../../generated/prisma';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFormationDto } from './dto/create-formation.dto';
import { UpdateFormationDto } from './dto/update-formation.dto';
import { uploadImageToCloudinary } from 'src/utils/cloudinary';

type FormationListFilters = {
  search?: string;
  categoryId?: number;
  minDuree?: number;
  maxDuree?: number;
  includeLessons?: boolean;
  createdFrom?: string;
  createdTo?: string;
  page: number;
  limit: number;
};

@Injectable()
export class FormationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: FormationListFilters) {
    const {
      page,
      limit,
      search,
      categoryId,
      minDuree,
      maxDuree,
      includeLessons,
      createdFrom,
      createdTo,
    } = query;

    const where: Prisma.FormationContinueWhereInput = {
      AND: [
        categoryId ? { categoryId } : {},
        search
          ? {
              OR: [
                { name: { contains: search } },
                { competence: { contains: search } },
                { comment: { contains: search } },
              ],
            }
          : {},
        typeof minDuree === 'number' ? { dureeHeures: { gte: minDuree } } : {},
        typeof maxDuree === 'number' ? { dureeHeures: { lte: maxDuree } } : {},
        createdFrom ? { createdAt: { gte: new Date(createdFrom) } } : {},
        createdTo ? { createdAt: { lte: new Date(createdTo) } } : {},
      ],
    };

    const include: Prisma.FormationContinueInclude = includeLessons
      ? { category: true, lessons: { orderBy: { orderIndex: 'asc' } } }
      : { category: true };

    const [total, data] = await this.prisma.$transaction([
      this.prisma.formationContinue.count({ where }),
      this.prisma.formationContinue.findMany({
        where,
        include,
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

  async findOne(id: number, includeLessons = true) {
    const include: Prisma.FormationContinueInclude = includeLessons
      ? { category: true, lessons: { orderBy: { orderIndex: 'asc' } } }
      : { category: true };

    const item = await this.prisma.formationContinue.findUnique({
      where: { formationId: id },
      include,
    });
    if (!item) throw new NotFoundException('Formation not found');
    return item;
  }

  async create(dto: CreateFormationDto) {
    await this.ensureCategory(dto.categoryId);

    // 1) Uploader les éventuels fileUrl base64 AVANT la création
    let lessonsCreate:
      | Prisma.LessonCreateWithoutFormationInput[]
      | undefined;

    if (dto.lessons?.length) {
      // Upload en parallèle
      const prepared = await Promise.all(
        dto.lessons.map(async (l) => {
          let uploadedUrl: string | undefined = l.fileUrl;
          if (typeof l.fileUrl === 'string') {
            try {
              uploadedUrl = await uploadImageToCloudinary(l.fileUrl, 'formations/tmp');
            } catch (e) {
              // si format non supporté, on peut soit lever, soit ignorer le fileUrl
              // ici on re-lève une erreur claire
              throw e;
            }
          }
          return {
            title: l.title,
            description: l.description,
            fileUrl: uploadedUrl,
            orderIndex: l.orderIndex,
          } satisfies Prisma.LessonCreateWithoutFormationInput;
        })
      );

      lessonsCreate = prepared;
    }

    // 2) Création formation + leçons
    return this.prisma.formationContinue.create({
      data: {
        name: dto.name,
        categoryId: dto.categoryId,
        competence: dto.competence,
        dureeHeures: dto.dureeHeures,
        comment: dto.comment,
        lessons: lessonsCreate?.length
          ? { create: lessonsCreate }
          : undefined,
      },
      include: { category: true, lessons: true },
    });
  }

  async update(id: number, dto: UpdateFormationDto) {
    await this.ensureFormation(id);
    if (dto.categoryId) await this.ensureCategory(dto.categoryId);

    const lessonsOps: Prisma.LessonUpdateManyWithoutFormationNestedInput = {};

    // Suppressions
    if (dto.removeLessonIds?.length) {
      lessonsOps.deleteMany = dto.removeLessonIds.map((lessonId) => ({ lessonId }));
    }

    // Upserts
    if (dto.lessons?.length) {
      const toUpdate = dto.lessons.filter((l) => !!l.lessonId);
      const toCreate = dto.lessons.filter((l) => !l.lessonId);

      // a) UPDATE existants (upload si base64 fourni)
      if (toUpdate.length) {
        const updatedPayloads = await Promise.all(
          toUpdate.map(async (l) => {
            let uploadedUrl = l.fileUrl;
            if (typeof l.fileUrl === 'string') {
              // upload seulement si base64 ou si tu veux réécrire l'URL
              try {
                uploadedUrl = await uploadImageToCloudinary(l.fileUrl, `formations/${id}`);
              } catch (e) {
                // si format non supporté: soit on garde l'ancien (laisser undefined), soit on lève une erreur
                // ici, si l.fileUrl est fourni mais invalide → on lève
                throw e;
              }
            }
            return {
              where: { lessonId: l.lessonId! },
              data: {
                title: l.title,
                description: l.description,
                fileUrl: uploadedUrl,
                orderIndex: l.orderIndex,
              },
            } satisfies Prisma.LessonUpdateWithWhereUniqueWithoutFormationInput;
          })
        );

        lessonsOps.update = updatedPayloads;
      }

      // b) CREATE nouveaux (upload si base64 fourni)
      if (toCreate.length) {
        const createdPayloads = await Promise.all(
          toCreate
            .filter((l) => !!l.title) // title requis
            .map(async (l) => {
              let uploadedUrl = l.fileUrl;
              if (typeof l.fileUrl === 'string') {
                try {
                  uploadedUrl = await uploadImageToCloudinary(l.fileUrl, `formations/${id}`);
                } catch (e) {
                  throw e;
                }
              }
              return {
                title: l.title!, // garanti par filter
                description: l.description,
                fileUrl: uploadedUrl,
                orderIndex: l.orderIndex,
              } satisfies Prisma.LessonCreateWithoutFormationInput;
            })
        );

        if (createdPayloads.length) {
          lessonsOps.create = createdPayloads;
        }
      }
    }

    return this.prisma.formationContinue.update({
      where: { formationId: id },
      data: {
        name: dto.name,
        categoryId: dto.categoryId,
        competence: dto.competence,
        dureeHeures: dto.dureeHeures,
        comment: dto.comment,
        lessons: Object.keys(lessonsOps).length ? lessonsOps : undefined,
      },
      include: { category: true, lessons: { orderBy: { orderIndex: 'asc' } } },
    });
  }

  // --- helpers ---
  private async ensureCategory(categoryId: number) {
    const exists = await this.prisma.category.findUnique({
      where: { categoryId },
      select: { categoryId: true },
    });
    if (!exists) throw new NotFoundException('Category not found');
  }

  private async ensureFormation(id: number) {
    const exists = await this.prisma.formationContinue.findUnique({
      where: { formationId: id },
      select: { formationId: true },
    });
    if (!exists) throw new NotFoundException('Formation not found');
  }
}

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

// --------------------
// Types de réponse API
// --------------------
type LessonResponse = {
  lessonId: number;
  title: string;
  description?: string | null;
  fileUrl?: string | null;
  orderIndex?: number | null;
  formationId: number;
  createdAt: Date;
  updatedAt: Date;
  /** ⇩⇩ demandé : id + nom de la catégorie de la leçon */
  categoryId?: number | null;
  categoryName?: string | null;
};

type FormationResponse = {
  formationId: number;
  name: string;
  categoryId?: number | null;
  categoryName?: string | null;
  competence: string;
  dureeHeures: number;
  comment?: string | null;
  createdAt: Date;
  updatedAt: Date;
  lessons?: LessonResponse[];
};

@Injectable()
export class FormationsService {
  constructor(private readonly prisma: PrismaService) {}

  // --------------------
  // Helpers: mapping
  // --------------------
  private mapLesson = (l: any): LessonResponse => ({
    lessonId: l.lessonId,
    title: l.title,
    description: l.description ?? null,
    fileUrl: l.fileUrl ?? null,
    orderIndex: l.orderIndex ?? null,
    formationId: l.formationId,
    createdAt: l.createdAt,
    updatedAt: l.updatedAt,
    // ⇩⇩ on expose categoryId et categoryName sur la leçon
    categoryId: l.category?.categoryId ?? l.categoryId ?? null,
    categoryName: l.category?.name ?? null,
  });

  private mapFormation = (f: any, withLessons = true): FormationResponse => ({
    formationId: f.formationId,
    name: f.name,
    categoryId: f.category?.categoryId ?? f.categoryId ?? null,
    categoryName: f.category?.name ?? null,
    competence: f.competence,
    dureeHeures: f.dureeHeures,
    comment: f.comment ?? null,
    createdAt: f.createdAt,
    updatedAt: f.updatedAt,
    lessons: withLessons && Array.isArray(f.lessons) ? f.lessons.map(this.mapLesson) : undefined,
  });

  // --------------------
  // FIND ALL
  // --------------------
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
                { category: { name: { contains: search } } }, // recherche par nom de catégorie
              ],
            }
          : {},
        typeof minDuree === 'number' ? { dureeHeures: { gte: minDuree } } : {},
        typeof maxDuree === 'number' ? { dureeHeures: { lte: maxDuree } } : {},
        createdFrom ? { createdAt: { gte: new Date(createdFrom) } } : {},
        createdTo ? { createdAt: { lte: new Date(createdTo) } } : {},
      ],
    };

    const includeBaseCategory = { select: { categoryId: true, name: true } } as const;

    const include: Prisma.FormationContinueInclude = includeLessons
      ? {
          category: includeBaseCategory,
          lessons: {
            orderBy: { orderIndex: 'asc' },
            include: { category: includeBaseCategory },
          },
        }
      : { category: includeBaseCategory };

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.formationContinue.count({ where }),
      this.prisma.formationContinue.findMany({
        where,
        include,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    const data = rows.map((r) => this.mapFormation(r, !!includeLessons));

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

  // --------------------
  // FIND ONE
  // --------------------
  async findOne(id: number, includeLessons = true) {
    const includeBaseCategory = { select: { categoryId: true, name: true } } as const;

    const include: Prisma.FormationContinueInclude = includeLessons
      ? {
          category: includeBaseCategory,
          lessons: {
            orderBy: { orderIndex: 'asc' },
            include: { category: includeBaseCategory },
          },
        }
      : { category: includeBaseCategory };

    const item = await this.prisma.formationContinue.findUnique({
      where: { formationId: id },
      include,
    });
    if (!item) throw new NotFoundException('Formation not found');

    return this.mapFormation(item, includeLessons);
  }

  // --------------------
  // CREATE
  // --------------------
  async create(dto: CreateFormationDto) {
    await this.ensureCategory(dto.categoryId);

    let lessonsCreate: Prisma.LessonCreateWithoutFormationInput[] | undefined;

    if (dto.lessons?.length) {
      // Vérifier l’existence des catégories de leçon (si fournies) en parallèle
      const uniqueLessonCatIds = Array.from(
        new Set(
          dto.lessons
            .map((l) => l.categoryId)
            .filter((v): v is number => typeof v === 'number'),
        ),
      );
      if (uniqueLessonCatIds.length) {
        await Promise.all(uniqueLessonCatIds.map((cid) => this.ensureCategory(cid)));
      }

      // Upload en parallèle + préparation payload
      const prepared = await Promise.all(
        dto.lessons.map(async (l) => {
          let uploadedUrl: string | undefined = l.fileUrl;
          if (typeof l.fileUrl === 'string') {
            uploadedUrl = await uploadImageToCloudinary(l.fileUrl, 'formations/tmp');
          }
          return {
            title: l.title,
            description: l.description,
            fileUrl: uploadedUrl,
            orderIndex: l.orderIndex,
            ...(typeof l.categoryId === 'number'
              ? { category: { connect: { categoryId: l.categoryId } } }
              : {}),
          } satisfies Prisma.LessonCreateWithoutFormationInput;
        }),
      );

      lessonsCreate = prepared;
    }

    const includeBaseCategory = { select: { categoryId: true, name: true } } as const;

    const created = await this.prisma.formationContinue.create({
      data: {
        name: dto.name,
        categoryId: dto.categoryId,
        competence: dto.competence,
        dureeHeures: dto.dureeHeures,
        comment: dto.comment,
        lessons: lessonsCreate?.length ? { create: lessonsCreate } : undefined,
      },
      include: {
        category: includeBaseCategory,
        lessons: { orderBy: { orderIndex: 'asc' }, include: { category: includeBaseCategory } },
      },
    });

    return this.mapFormation(created, true);
  }

  // --------------------
  // UPDATE
  // --------------------
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

      // Vérifier d’avance les catégories mentionnées
      const catIdsToCheck = Array.from(
        new Set(
          dto.lessons
            .map((l) => l.categoryId)
            .filter((v): v is number => typeof v === 'number'),
        ),
      );
      if (catIdsToCheck.length) {
        await Promise.all(catIdsToCheck.map((cid) => this.ensureCategory(cid)));
      }

      // a) UPDATE existants (upload si base64 fourni)
      if (toUpdate.length) {
        const updatedPayloads = await Promise.all(
          toUpdate.map(async (l) => {
            let uploadedUrl = l.fileUrl;
            if (typeof l.fileUrl === 'string') {
              uploadedUrl = await uploadImageToCloudinary(l.fileUrl, `formations/${id}`);
            }
            return {
              where: { lessonId: l.lessonId! },
              data: {
                title: l.title,
                description: l.description,
                fileUrl: uploadedUrl,
                orderIndex: l.orderIndex,
                ...(typeof l.categoryId === 'number' ? { categoryId: l.categoryId } : {}),
              },
            } satisfies Prisma.LessonUpdateWithWhereUniqueWithoutFormationInput;
          }),
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
                uploadedUrl = await uploadImageToCloudinary(l.fileUrl, `formations/${id}`);
              }
              return {
                title: l.title!, // garanti par filter
                description: l.description,
                fileUrl: uploadedUrl,
                orderIndex: l.orderIndex,
                ...(typeof l.categoryId === 'number'
                  ? { category: { connect: { categoryId: l.categoryId } } }
                  : {}),
              } satisfies Prisma.LessonCreateWithoutFormationInput;
            }),
        );

        if (createdPayloads.length) {
          lessonsOps.create = createdPayloads;
        }
      }
    }

    const includeBaseCategory = { select: { categoryId: true, name: true } } as const;

    const updated = await this.prisma.formationContinue.update({
      where: { formationId: id },
      data: {
        name: dto.name,
        categoryId: dto.categoryId,
        competence: dto.competence,
        dureeHeures: dto.dureeHeures,
        comment: dto.comment,
        lessons: Object.keys(lessonsOps).length ? lessonsOps : undefined,
      },
      include: {
        category: includeBaseCategory,
        lessons: {
          orderBy: { orderIndex: 'asc' },
          include: { category: includeBaseCategory },
        },
      },
    });

    return this.mapFormation(updated, true);
  }

  // --- helpers ---
  private async ensureCategory(categoryId?: number) {
    if (!categoryId) return;
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

import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from 'generated/prisma';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateFicheDto } from './dto/create-fiche.dto';
import { UpdateFicheDto } from './dto/update-fiche.dto';
import { QueryFichesDto } from './dto/query-fiches.dto';

@Injectable()
export class FichesService {
  constructor(private readonly prisma: PrismaService) {}

  private async ensureDoctor(userId: number) {
    const u = await this.prisma.user.findUnique({ where: { userId } });
    if (!u) throw new NotFoundException({ message: `User ${userId} introuvable` });
    if (u.userType !== 'ADMIN' && u.userType !== 'MEDECIN' && u.userType !== 'SUPERADMIN') {
      throw new ForbiddenException({ message: 'Réservé aux admins/médecins' });
    }
  }

  async createFiche(dto: CreateFicheDto) {
    // Dans tes règles, c’est l’ADMIN (id=5) qui crée → on accepte ADMIN/MEDECIN ici par sécurité
    await this.ensureDoctor(dto.createdBy);
    const item = await this.prisma.ficheStructuree.create({
      data: {
        title: dto.title,
        description: dto.description,
        createdBy: dto.createdBy,
        questions: {
          create: dto.questions
            .sort((a,b)=> (a.orderIndex??0)-(b.orderIndex??0))
            .map(q => ({ label: q.label, orderIndex: q.orderIndex ?? 0 })),
        },
      },
      include: { questions: { orderBy: { orderIndex: 'asc' } } },
    });
    return { item };
  }

  // ⬇️ NOUVELLE SIGNATURE : tout optionnel, retourne tout par défaut (paginé)
  async listFiches(query: QueryFichesDto) {
    const page  = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 20);
    if (page < 1 || limit < 1) throw new BadRequestException({ message: 'Page et limit >= 1' });
    const skip = (page - 1) * limit;

    const where: Prisma.FicheStructureeWhereInput = {};
    if (query.createdBy) where.createdBy = query.createdBy;
    if (typeof query.isActive === 'boolean') where.isActive = query.isActive;
    if (query.q && query.q.trim()) {
      where.OR = [
        { title: { contains: query.q, mode: 'insensitive' } as any },
        { description: { contains: query.q, mode: 'insensitive' } as any },
      ];
    }

    const includeQuestions = query.includeQuestions !== false;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.ficheStructuree.findMany({
        where,
        skip, take: limit,
        orderBy: { updatedAt: 'desc' },
        include: includeQuestions ? { questions: { orderBy: { orderIndex: 'asc' } } } : undefined,
      }),
      this.prisma.ficheStructuree.count({ where }),
    ]);

    return { items, meta: { total, page, limit, lastPage: Math.ceil(total / limit) } };
  }

  async getFiche(id: number) {
    const item = await this.prisma.ficheStructuree.findUnique({
      where: { ficheId: id },
      include: { questions: { orderBy: { orderIndex: 'asc' } } },
    });
    if (!item) throw new NotFoundException({ message: 'Fiche introuvable' });
    return { item };
  }

  async updateFiche(id: number, dto: UpdateFicheDto) {
    const fiche = await this.prisma.ficheStructuree.findUnique({
      where: { ficheId: id },
      include: { questions: true },
    });
    if (!fiche) throw new NotFoundException({ message: 'Fiche introuvable' });
    // l’ADMIN (5) étant le créateur dans ton process → on valide son rôle à la création
    await this.ensureDoctor(fiche.createdBy);

    const patch: Prisma.FicheStructureeUpdateInput = {};
    if (dto.title !== undefined) patch.title = dto.title;
    if (dto.description !== undefined) patch.description = dto.description;
    if (dto.isActive !== undefined) patch.isActive = dto.isActive;

    if (dto.questions) {
      const incomingIds = new Set<number>();
      const updates: Prisma.FicheQuestionUpdateWithWhereUniqueWithoutFicheInput[] = [];
      const creates: Prisma.FicheQuestionCreateWithoutFicheInput[] = [];

      for (const q of dto.questions) {
        if (q.ficheQuestionId) {
          incomingIds.add(q.ficheQuestionId);
          updates.push({
            where: { ficheQuestionId: q.ficheQuestionId },
            data: {
              ...(q.label !== undefined ? { label: q.label } : {}),
              ...(q.orderIndex !== undefined ? { orderIndex: q.orderIndex } : {}),
            },
          });
        } else {
          if (!q.label) throw new BadRequestException({ message: 'label requis pour nouvelle question' });
          creates.push({ label: q.label, orderIndex: q.orderIndex ?? 0 });
        }
      }

      const toDelete = fiche.questions
        .filter(q => !incomingIds.has(q.ficheQuestionId))
        .map(q => q.ficheQuestionId);

      await this.prisma.$transaction([
        this.prisma.ficheStructuree.update({ where: { ficheId: id }, data: patch }),
        ...(toDelete.length ? [this.prisma.ficheQuestion.deleteMany({ where: { ficheQuestionId: { in: toDelete } } })] : []),
        ...(updates.length ? [this.prisma.ficheStructuree.update({
          where: { ficheId: id },
          data: { questions: { update: updates } },
        })] : []),
        ...(creates.length ? [this.prisma.ficheStructuree.update({
          where: { ficheId: id },
          data: { questions: { create: creates } },
        })] : []),
      ]);

      return this.getFiche(id);
    }

    const updated = await this.prisma.ficheStructuree.update({
      where: { ficheId: id },
      data: patch,
      include: { questions: { orderBy: { orderIndex: 'asc' } } },
    });
    return { item: updated };
  }
}

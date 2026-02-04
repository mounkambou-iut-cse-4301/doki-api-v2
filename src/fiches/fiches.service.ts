// // src/fiches/fiches.service.ts
// import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
// import { Prisma } from 'generated/prisma';
// import { PrismaService } from 'src/prisma/prisma.service';
// import { CreateFicheDto, QType } from './dto/create-fiche.dto';
// import { UpdateFicheDto } from './dto/update-fiche.dto';
// import { randomUUID } from 'crypto';

// // Helper pour satisfaire le type Prisma InputJsonValue
// const asJson = <T,>(v: T): Prisma.InputJsonValue => v as unknown as Prisma.InputJsonValue;

// // Helper pour assainir/typer les options SELECT issues des DTO upsert
// const sanitizeOptions = (opts?: Array<{ label?: string; value?: string }>) =>
//   (opts ?? [])
//     .filter(
//       (o): o is { label: string; value: string } =>
//         !!o &&
//         typeof o.label === 'string' &&
//         o.label.trim() !== '' &&
//         typeof o.value === 'string' &&
//         o.value.trim() !== ''
//     )
//     .map(({ label, value }) => ({ label, value }));

// // Types internes (facultatifs, utiles pour lisibilité)
// type QuestionTEXT = {
//   id: string;
//   label: string;
//   type: 'TEXT';
//   order: number;
// };
// type QuestionSELECT = {
//   id: string;
//   label: string;
//   type: 'SELECT';
//   order: number;
//   options: { label: string; value: string }[];
// };
// type Question = QuestionTEXT | QuestionSELECT;

// @Injectable()
// export class FichesService {
//   constructor(private readonly prisma: PrismaService) {}

//   /**
//    * POST /fiches
//    * Créer une fiche avec questions (TEXT | SELECT).
//    * - SELECT => au moins 1 option valide
//    * - Génère des UUID pour chaque question
//    */
//   async createFiche(dto: CreateFicheDto) {
//     // Validation de base
//     dto.questions.forEach((q) => {
//       if (q.type === QType.SELECT && (!q.options || q.options.length === 0)) {
//         throw new BadRequestException(
//           `La question "${q.label}" (SELECT) doit définir au moins une option.`
//         );
//       }
//     });

//     const questions: Question[] = dto.questions
//       .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
//       .map((q) => {
//         if (q.type === QType.SELECT) {
//           const options = sanitizeOptions(q.options);
//           if (options.length === 0) {
//             throw new BadRequestException(
//               `La question "${q.label}" (SELECT) doit avoir au moins 1 option valide.`
//             );
//           }
//           return {
//             id: randomUUID(),
//             label: q.label,
//             type: 'SELECT',
//             order: q.order ?? 0,
//             options,
//           };
//         }
//         return {
//           id: randomUUID(),
//           label: q.label,
//           type: 'TEXT',
//           order: q.order ?? 0,
//         };
//       });

//     const item = await this.prisma.fiche.create({
//       data: {
//         title: dto.title,
//         description: dto.description,
//         createdBy: dto.createdBy,
//         questions: asJson(questions),
//         responses: asJson([]),
//       },
//     });

//     return { item };
//   }

//   /**
//    * GET /fiches
//    * Liste paginée + recherche sur title/description
//    */
//   async listFiches(params: {
//     page?: number;
//     limit?: number;
//     q?: string;
//     createdBy?: number;
//     isActive?: boolean;
//   }) {
//     const page = Number(params.page ?? 1);
//     const limit = Number(params.limit ?? 20);
//     if (page < 1 || limit < 1) {
//       throw new BadRequestException('page et limit doivent être >= 1.');
//     }
//     const skip = (page - 1) * limit;

//     const where: any = {};
//     if (params.createdBy) where.createdBy = params.createdBy;
//     if (typeof params.isActive === 'boolean') where.isActive = params.isActive;
//     if (params.q?.trim()) {
//       where.OR = [
//         { title: { contains: params.q, mode: 'insensitive' } },
//         { description: { contains: params.q, mode: 'insensitive' } },
//       ];
//     }

//     const [items, total] = await this.prisma.$transaction([
//       this.prisma.fiche.findMany({
//         where,
//         skip,
//         take: limit,
//         orderBy: { updatedAt: 'desc' },
//       }),
//       this.prisma.fiche.count({ where }),
//     ]);

//     return {
//       items,
//       meta: { total, page, limit, lastPage: Math.ceil(total / limit) },
//     };
//   }

//   /**
//    * GET /fiches/:id
//    * Retourne l’item (questions + responses JSON inclus tels quels)
//    */
//   async getFiche(id: number) {
//     const item = await this.prisma.fiche.findUnique({ where: { ficheId: id } });
//     if (!item) throw new NotFoundException('Fiche introuvable');
//     return { item };
//   }

//   /**
//    * PATCH /fiches/:id
//    * Mise à jour partielle :
//    * - title / description / isActive : patch direct
//    * - questions : politique "liste finale" simple (remplace)
//    *   * si question.id absent => nouvelle question (uuid)
//    *   * si présent => merge léger (label/type/order; options remplacées si fournies)
//    *   * validation SELECT: au moins 1 option valide
//    */
//   async updateFiche(id: number, dto: UpdateFicheDto) {
//     const fiche = await this.prisma.fiche.findUnique({ where: { ficheId: id } });
//     if (!fiche) throw new NotFoundException('Fiche introuvable');

//     let questions = (fiche.questions as Question[]) ?? [];

//     if (dto.questions) {
//       const next: Question[] = [];

//       for (const q of dto.questions) {
//         if (!q.id) {
//           // Nouvelle question
//           const type = (q.type ?? 'TEXT') as 'TEXT' | 'SELECT';
//           if (type === 'SELECT') {
//             const options = sanitizeOptions(q.options);
//             if (options.length === 0) {
//               throw new BadRequestException(
//                 `La question "${q.label ?? 'Sans titre'}" (SELECT) doit avoir au moins 1 option valide.`
//               );
//             }
//             next.push({
//               id: randomUUID(),
//               label: q.label ?? 'Sans titre',
//               type: 'SELECT',
//               order: q.order ?? 0,
//               options,
//             });
//           } else {
//             next.push({
//               id: randomUUID(),
//               label: q.label ?? 'Sans titre',
//               type: 'TEXT',
//               order: q.order ?? 0,
//             });
//           }
//           continue;
//         }

//         // Update question existante
//         const prev = questions.find((x) => x.id === q.id);
//         const type = (q.type ?? prev?.type ?? 'TEXT') as 'TEXT' | 'SELECT';

//         if (type === 'SELECT') {
//           // Si q.options fourni => on remplace après sanitisation; sinon on garde les anciennes
//           let options: { label: string; value: string }[];
//           if (q.options) {
//             const sanitized = sanitizeOptions(q.options);
//             if (sanitized.length === 0) {
//               throw new BadRequestException(
//                 `La question "${q.label ?? prev?.label ?? 'Sans titre'}" (SELECT) doit avoir au moins 1 option valide.`
//               );
//             }
//             options = sanitized;
//           } else {
//             if (prev && prev.type === 'SELECT') {
//               options = prev.options;
//             } else {
//               throw new BadRequestException(
//                 `Options manquantes pour la question "${q.label ?? prev?.label ?? 'Sans titre'}" (SELECT).`
//               );
//             }
//           }

//           next.push({
//             id: q.id,
//             label: q.label ?? prev?.label ?? 'Sans titre',
//             type: 'SELECT',
//             order: q.order ?? (prev?.order ?? 0),
//             options,
//           });
//         } else {
//           // TEXT : on ignore options
//           next.push({
//             id: q.id,
//             label: q.label ?? prev?.label ?? 'Sans titre',
//             type: 'TEXT',
//             order: q.order ?? (prev?.order ?? 0),
//           });
//         }
//       }

//       // Tri final et assignation
//       questions = next.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
//     }

//     const updated = await this.prisma.fiche.update({
//       where: { ficheId: id },
//       data: {
//         ...(dto.title !== undefined ? { title: dto.title } : {}),
//         ...(dto.description !== undefined ? { description: dto.description } : {}),
//         ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
//         ...(dto.questions ? { questions: asJson(questions) } : {}),
//       },
//     });

//     return { item: updated };
//   }
// }
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from 'generated/prisma';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateFicheDto, QType } from './dto/create-fiche.dto';
import { UpdateFicheDto } from './dto/update-fiche.dto';
import { randomUUID } from 'crypto';

// Helper pour satisfaire le type Prisma InputJsonValue
const asJson = <T,>(v: T): Prisma.InputJsonValue => v as unknown as Prisma.InputJsonValue;

// Helper pour assainir/typer les options SELECT issues des DTO upsert
const sanitizeOptions = (opts?: Array<{ label?: string; value?: string }>) =>
  (opts ?? [])
    .filter(
      (o): o is { label: string; value: string } =>
        !!o &&
        typeof o.label === 'string' &&
        o.label.trim() !== '' &&
        typeof o.value === 'string' &&
        o.value.trim() !== ''
    )
    .map(({ label, value }) => ({ label, value }));

// Types internes (facultatifs, utiles pour lisibilité)
type QuestionTEXT = {
  id: string;
  label: string;
  type: 'TEXT';
  order: number;
};
type QuestionSELECT = {
  id: string;
  label: string;
  type: 'SELECT';
  order: number;
  options: { label: string; value: string }[];
};
type Question = QuestionTEXT | QuestionSELECT;

@Injectable()
export class FichesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * POST /fiches
   * Créer une fiche avec questions (TEXT | SELECT).
   * - SELECT => au moins 1 option valide
   * - Génère des UUID pour chaque question
   */
  async createFiche(dto: CreateFicheDto) {
    // Validation de base
    dto.questions.forEach((q) => {
      if (q.type === QType.SELECT && (!q.options || q.options.length === 0)) {
        throw new BadRequestException(
          `La question "${q.label}" (SELECT) doit définir au moins une option.`
        );
      }
    });

    const questions: Question[] = dto.questions
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map((q) => {
        if (q.type === QType.SELECT) {
          const options = sanitizeOptions(q.options);
          if (options.length === 0) {
            throw new BadRequestException(
              `La question "${q.label}" (SELECT) doit avoir au moins 1 option valide.`
            );
          }
          return {
            id: randomUUID(),
            label: q.label,
            type: 'SELECT',
            order: q.order ?? 0,
            options,
          };
        }
        return {
          id: randomUUID(),
          label: q.label,
          type: 'TEXT',
          order: q.order ?? 0,
        };
      });

    const item = await this.prisma.fiche.create({
      data: {
        title: dto.title,
        description: dto.description,
        createdBy: dto.createdBy,
        questions: asJson(questions),
        responses: asJson([]),
      },
    });

    return { item };
  }

  /**
   * GET /fiches
   * Liste paginée + recherche sur title/description
   * ✅ Ne retourne PAS responses
   */
  async listFiches(params: {
    page?: number;
    limit?: number;
    q?: string;
    createdBy?: number;
    isActive?: boolean;
  }) {
    const page = Number(params.page ?? 1);
    const limit = Number(params.limit ?? 20);
    if (page < 1 || limit < 1) {
      throw new BadRequestException('page et limit doivent être >= 1.');
    }
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.createdBy) where.createdBy = params.createdBy;
    if (typeof params.isActive === 'boolean') where.isActive = params.isActive;
    if (params.q?.trim()) {
      where.OR = [
        { title: { contains: params.q, mode: 'insensitive' } },
        { description: { contains: params.q, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.fiche.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },

        // ✅ on exclut responses en listant explicitement les champs à renvoyer
        select: {
          ficheId: true,
          title: true,
          description: true,
          createdBy: true,
          isActive: true,
          questions: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.fiche.count({ where }),
    ]);

    return {
      items,
      meta: { total, page, limit, lastPage: Math.ceil(total / limit) },
    };
  }

  /**
   * GET /fiches/:id
   * Retourne l’item (questions + responses JSON inclus tels quels)
   */
  async getFiche(id: number) {
    const item = await this.prisma.fiche.findUnique({ where: { ficheId: id } });
    if (!item) throw new NotFoundException('Fiche introuvable');
    return { item };
  }

  /**
   * PATCH /fiches/:id
   * Mise à jour partielle :
   * - title / description / isActive : patch direct
   * - questions : politique "liste finale" simple (remplace)
   *   * si question.id absent => nouvelle question (uuid)
   *   * si présent => merge léger (label/type/order; options remplacées si fournies)
   *   * validation SELECT: au moins 1 option valide
   */
  async updateFiche(id: number, dto: UpdateFicheDto) {
    const fiche = await this.prisma.fiche.findUnique({ where: { ficheId: id } });
    if (!fiche) throw new NotFoundException('Fiche introuvable');

    let questions = (fiche.questions as Question[]) ?? [];

    if (dto.questions) {
      const next: Question[] = [];

      for (const q of dto.questions) {
        if (!q.id) {
          // Nouvelle question
          const type = (q.type ?? 'TEXT') as 'TEXT' | 'SELECT';
          if (type === 'SELECT') {
            const options = sanitizeOptions(q.options);
            if (options.length === 0) {
              throw new BadRequestException(
                `La question "${q.label ?? 'Sans titre'}" (SELECT) doit avoir au moins 1 option valide.`
              );
            }
            next.push({
              id: randomUUID(),
              label: q.label ?? 'Sans titre',
              type: 'SELECT',
              order: q.order ?? 0,
              options,
            });
          } else {
            next.push({
              id: randomUUID(),
              label: q.label ?? 'Sans titre',
              type: 'TEXT',
              order: q.order ?? 0,
            });
          }
          continue;
        }

        // Update question existante
        const prev = questions.find((x) => x.id === q.id);
        const type = (q.type ?? prev?.type ?? 'TEXT') as 'TEXT' | 'SELECT';

        if (type === 'SELECT') {
          // Si q.options fourni => on remplace après sanitisation; sinon on garde les anciennes
          let options: { label: string; value: string }[];
          if (q.options) {
            const sanitized = sanitizeOptions(q.options);
            if (sanitized.length === 0) {
              throw new BadRequestException(
                `La question "${q.label ?? prev?.label ?? 'Sans titre'}" (SELECT) doit avoir au moins 1 option valide.`
              );
            }
            options = sanitized;
          } else {
            if (prev && prev.type === 'SELECT') {
              options = prev.options;
            } else {
              throw new BadRequestException(
                `Options manquantes pour la question "${q.label ?? prev?.label ?? 'Sans titre'}" (SELECT).`
              );
            }
          }

          next.push({
            id: q.id,
            label: q.label ?? prev?.label ?? 'Sans titre',
            type: 'SELECT',
            order: q.order ?? (prev?.order ?? 0),
            options,
          });
        } else {
          // TEXT : on ignore options
          next.push({
            id: q.id,
            label: q.label ?? prev?.label ?? 'Sans titre',
            type: 'TEXT',
            order: q.order ?? (prev?.order ?? 0),
          });
        }
      }

      // Tri final et assignation
      questions = next.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    }

    const updated = await this.prisma.fiche.update({
      where: { ficheId: id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        ...(dto.questions ? { questions: asJson(questions) } : {}),
      },
    });

    return { item: updated };
  }

  /**
   * DELETE /fiches/:id
   * ✅ Interdit si la fiche a déjà des réponses (patients ayant répondu)
   */
  async deleteFiche(id: number) {
    const fiche = await this.prisma.fiche.findUnique({ where: { ficheId: id } });
    if (!fiche) throw new NotFoundException('Fiche introuvable');

    const responses = (fiche.responses as unknown as any[]) ?? [];
    if (Array.isArray(responses) && responses.length > 0) {
      throw new BadRequestException({
        message:
          "Impossible de supprimer cette fiche : des patients ont déjà répondu à ces questions.",
        messageE:
          'Cannot delete this fiche: patients have already submitted responses to these questions.',
      });
    }

    try {
      await this.prisma.fiche.delete({ where: { ficheId: id } });
      return { ok: true };
    } catch (e: any) {
      // Si FK (ex: messages FICHE_REQUEST pointent vers cette fiche) => message clair
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2003') {
        throw new BadRequestException({
          message:
            "Impossible de supprimer cette fiche : elle est référencée par d'autres données (ex: messages).",
          messageE:
            'Cannot delete this fiche: it is referenced by other records (e.g. messages).',
        });
      }
      throw e;
    }
  }
}

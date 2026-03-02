// src/fiches/fiches.service.ts
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from 'generated/prisma';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateFicheDto, QType } from './dto/create-fiche.dto';
import { UpdateFicheDto } from './dto/update-fiche.dto';
import { CreateFicheResponseDto } from './dto/create-response.dto';
import { QueryResponsesDto } from './dto/query-responses.dto';
import { randomUUID } from 'crypto';

// Helper pour satisfaire le type Prisma InputJsonValue
const asJson = <T,>(v: T): Prisma.InputJsonValue => v as unknown as Prisma.InputJsonValue;

// Helper pour assainir/typer les options SELECT
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

// Types internes avec guards de type
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
  multiple?: boolean;
  options: { label: string; value: string }[];
};

type Question = QuestionTEXT | QuestionSELECT;

type FicheResponse = {
  responseId: string;
  patientId: number;
  submittedAt: Date;
  answers: {
    questionId: string;
    value: string | string[];
  }[];
};

// Type guard pour vérifier si une question est de type SELECT
const isSelectQuestion = (question: Question): question is QuestionSELECT => {
  return question.type === 'SELECT';
};

@Injectable()
export class FichesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * POST /fiches
   * Créer une fiche avec questions (TEXT | SELECT).
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
            multiple: q.multiple ?? false,
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
   * Mise à jour partielle
   */
  async updateFiche(id: number, dto: UpdateFicheDto) {
    const fiche = await this.prisma.fiche.findUnique({ where: { ficheId: id } });
    if (!fiche) throw new NotFoundException('Fiche introuvable');

    let questions = (fiche.questions as unknown as Question[]) ?? [];

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
              multiple: q.multiple ?? false,
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
            if (prev && isSelectQuestion(prev)) {
              options = prev.options;
            } else {
              throw new BadRequestException(
                `Options manquantes pour la question "${q.label ?? prev?.label ?? 'Sans titre'}" (SELECT).`
              );
            }
          }

          const multiple = q.multiple ?? (prev && isSelectQuestion(prev) ? prev.multiple : false);

          next.push({
            id: q.id,
            label: q.label ?? prev?.label ?? 'Sans titre',
            type: 'SELECT',
            order: q.order ?? (prev?.order ?? 0),
            multiple,
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

  // ========== NOUVELLES MÉTHODES POUR LES RÉPONSES ==========

  /**
   * POST /fiches/:id/responses
   * Soumettre des réponses à une fiche
   */
  async submitResponse(ficheId: number, dto: CreateFicheResponseDto) {
    const fiche = await this.prisma.fiche.findUnique({
      where: { ficheId }
    });
    
    if (!fiche) {
      throw new NotFoundException('Fiche introuvable');
    }

    if (!fiche.isActive) {
      throw new BadRequestException({
        message: 'Cette fiche n\'est pas active.',
        messageE: 'This fiche is not active.'
      });
    }

    // Récupérer les questions existantes avec typage correct
    const questions = fiche.questions as unknown as Question[];

    // Valider que toutes les questions existent et respectent les contraintes
    for (const answer of dto.answers) {
      const question = questions.find(q => q.id === answer.questionId);
      if (!question) {
        throw new BadRequestException({
          message: `Question ${answer.questionId} introuvable dans cette fiche.`,
          messageE: `Question ${answer.questionId} not found in this fiche.`
        });
      }

      // Validation spécifique selon le type
      if (isSelectQuestion(question)) {
        const values = Array.isArray(answer.value) ? answer.value : [answer.value];
        
        // Vérifier le nombre de réponses si multiple est false
        if (!question.multiple && values.length > 1) {
          throw new BadRequestException({
            message: `La question "${question.label}" n'autorise qu'une seule réponse.`,
            messageE: `Question "${question.label}" allows only one answer.`
          });
        }

        // Valider que toutes les valeurs sont dans les options
        const validValues = question.options.map(o => o.value);
        for (const val of values) {
          if (!validValues.includes(val)) {
            throw new BadRequestException({
              message: `Valeur "${val}" invalide pour la question "${question.label}".`,
              messageE: `Value "${val}" is invalid for question "${question.label}".`
            });
          }
        }
      } else {
        // Pour TEXT, on s'assure que c'est une string
        if (Array.isArray(answer.value)) {
          throw new BadRequestException({
            message: `La question "${question.label}" (TEXT) doit recevoir une réponse textuelle, pas un tableau.`,
            messageE: `Question "${question.label}" (TEXT) must receive a text answer, not an array.`
          });
        }
      }
    }

    // Vérifier que toutes les questions ont une réponse
    const answeredQuestionIds = dto.answers.map(a => a.questionId);
    const missingQuestions = questions
      .filter(q => !answeredQuestionIds.includes(q.id))
      .map(q => q.label);

    if (missingQuestions.length > 0) {
      throw new BadRequestException({
        message: `Questions sans réponse : ${missingQuestions.join(', ')}`,
        messageE: `Unanswered questions: ${missingQuestions.join(', ')}`
      });
    }

    // Créer la nouvelle réponse
    const newResponse: FicheResponse = {
      responseId: `resp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      patientId: dto.patientId,
      submittedAt: new Date(),
      answers: dto.answers.map(a => ({
        questionId: a.questionId,
        value: a.value
      }))
    };

    // Ajouter aux réponses existantes avec typage correct
    const currentResponses = (fiche.responses as unknown as FicheResponse[]) || [];
    const updatedResponses = [...currentResponses, newResponse];

    await this.prisma.fiche.update({
      where: { ficheId },
      data: {
        responses: asJson(updatedResponses)
      }
    });

    // Enrichir la réponse avec les libellés des questions pour le retour
    const enrichedAnswers = dto.answers.map(a => {
      const question = questions.find(q => q.id === a.questionId);
      return {
        questionId: a.questionId,
        question: question?.label,
        type: question?.type,
        multiple: question && isSelectQuestion(question) ? question.multiple : undefined,
        value: a.value
      };
    });

    return {
      message: 'Réponses enregistrées avec succès.',
      messageE: 'Responses saved successfully.',
      data: {
        responseId: newResponse.responseId,
        ficheId,
        patientId: dto.patientId,
        submittedAt: newResponse.submittedAt,
        answers: enrichedAnswers
      }
    };
  }

  /**
   * GET /fiches/:id/responses
   * Lister les réponses d'une fiche
   */
  async getResponses(ficheId: number, query: QueryResponsesDto) {
    const fiche = await this.prisma.fiche.findUnique({
      where: { ficheId }
    });

    if (!fiche) {
      throw new NotFoundException('Fiche introuvable');
    }

    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 20);
    const skip = (page - 1) * limit;

    const responses = (fiche.responses as unknown as FicheResponse[]) || [];
    const questions = fiche.questions as unknown as Question[];

    // Filtrer par patient si nécessaire
    let filteredResponses = responses;
    if (query.patientId) {
      filteredResponses = filteredResponses.filter(r => r.patientId === query.patientId);
    }

    // Pagination
    const total = filteredResponses.length;
    const paginatedResponses = filteredResponses.slice(skip, skip + limit);

    // Enrichir avec les infos patient
    const enrichedResponses = await Promise.all(
      paginatedResponses.map(async (resp) => {
        const patient = await this.prisma.user.findUnique({
          where: { userId: resp.patientId },
          select: { firstName: true, lastName: true }
        });

        const answers = resp.answers.map((a: any) => {
          const question = questions.find(q => q.id === a.questionId);
          return {
            questionId: a.questionId,
            question: question?.label,
            type: question?.type,
            multiple: question && isSelectQuestion(question) ? question.multiple : undefined,
            value: a.value
          };
        });

        return {
          responseId: resp.responseId,
          patientId: resp.patientId,
          patientName: patient ? `${patient.firstName} ${patient.lastName}` : 'Inconnu',
          submittedAt: resp.submittedAt,
          answers
        };
      })
    );

    return {
      message: 'Réponses récupérées avec succès.',
      messageE: 'Responses retrieved successfully.',
      data: enrichedResponses,
      meta: {
        total,
        page,
        limit,
        lastPage: Math.ceil(total / limit)
      }
    };
  }

  /**
   * GET /fiches/:id/responses/:responseId
   * Obtenir une réponse spécifique
   */
  async getResponseById(ficheId: number, responseId: string) {
    const fiche = await this.prisma.fiche.findUnique({
      where: { ficheId }
    });

    if (!fiche) {
      throw new NotFoundException('Fiche introuvable');
    }

    const responses = (fiche.responses as unknown as FicheResponse[]) || [];
    const response = responses.find(r => r.responseId === responseId);

    if (!response) {
      throw new NotFoundException({
        message: 'Réponse introuvable.',
        messageE: 'Response not found.'
      });
    }

    // Récupérer les infos du patient
    const patient = await this.prisma.user.findUnique({
      where: { userId: response.patientId },
      select: { 
        firstName: true, 
        lastName: true, 
        phone: true,
        email: true 
      }
    });

    const questions = fiche.questions as unknown as Question[];
    const answers = response.answers.map((a: any) => {
      const question = questions.find(q => q.id === a.questionId);
      return {
        questionId: a.questionId,
        question: question?.label,
        type: question?.type,
        multiple: question && isSelectQuestion(question) ? question.multiple : undefined,
        options: question && isSelectQuestion(question) ? question.options : undefined,
        value: a.value
      };
    });

    return {
      message: 'Réponse récupérée avec succès.',
      messageE: 'Response retrieved successfully.',
      data: {
        responseId: response.responseId,
        ficheId,
        ficheTitle: fiche.title,
        patientId: response.patientId,
        patientName: patient ? `${patient.firstName} ${patient.lastName}` : 'Inconnu',
        patientPhone: patient?.phone,
        patientEmail: patient?.email,
        submittedAt: response.submittedAt,
        answers
      }
    };
  }
}
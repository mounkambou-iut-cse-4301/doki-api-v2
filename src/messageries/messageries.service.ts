import {
  BadRequestException, ForbiddenException, Injectable, NotFoundException,
} from '@nestjs/common';
import { Prisma, UserType } from 'generated/prisma';
import { PrismaService } from 'src/prisma/prisma.service';
import { SendDmMessageDto } from './dto/send-dm-message.dto';
import { QueryConversationsDto } from './dto/query-conversations.dto';
import { QueryMessagesDto } from 'src/common/dto/query-messages.dto';
import { SendFicheRequestDto } from './dto/send-fiche-request.dto';
import { SubmitFicheResponseDto } from './dto/submit-fiche-response.dto';
import { QueryConversationDetailDto } from './dto/query-conversation-detail.dto';

@Injectable()
export class MessageriesService {
  constructor(private readonly prisma: PrismaService) {}

  /* ------------------ Helpers ------------------ */
  private async getOrCreateConversation(medecinId: number, patientId: number) {
    const [med, pat] = await Promise.all([
      this.prisma.user.findUnique({ where: { userId: medecinId } }),
      this.prisma.user.findUnique({ where: { userId: patientId } }),
    ]);
    if (!med || med.userType !== UserType.MEDECIN) {
      throw new NotFoundException({ message: `Médecin ${medecinId} introuvable.` });
    }
    if (!pat || pat.userType !== UserType.PATIENT) {
      throw new NotFoundException({ message: `Patient ${patientId} introuvable.` });
    }
    const existing = await this.prisma.conversation.findUnique({
      where: { medecinId_patientId: { medecinId, patientId } },
    });
    if (existing) return existing;
    return this.prisma.conversation.create({
      data: { medecinId, patientId, lastMessageAt: new Date() },
    });
  }

  /* ------------------ DM basiques ------------------ */
  async sendDmMessage(senderId: number, dto: SendDmMessageDto) {
    if (senderId !== dto.medecinId && senderId !== dto.patientId) {
      throw new ForbiddenException({ message: `Vous ne faites pas partie de cette conversation.` });
    }
    const hasText = !!dto.content && dto.content.trim().length > 0;
    const hasMeta = dto.meta && Object.keys(dto.meta).length > 0;
    if (!hasText && !hasMeta) {
      throw new BadRequestException({ message: `Fournissez un message texte ou des métadonnées.` });
    }

    const conv = await this.getOrCreateConversation(dto.medecinId, dto.patientId);
    const receiverId = senderId === dto.medecinId ? dto.patientId : dto.medecinId;

    const created = await this.prisma.$transaction(async (tx) => {
      const msg = await tx.message.create({
        data: {
          kind: hasMeta && !hasText ? 'SYSTEM' : 'TEXT',
          conversationId: conv.conversationId,
          senderId,
          receiverId,
          content: hasText ? dto.content!.trim() : undefined,
          meta: hasMeta ? (dto.meta as unknown as Prisma.InputJsonValue) : undefined,
          isRead: false,
        },
      });
      await tx.conversation.update({
        where: { conversationId: conv.conversationId },
        data: { lastMessageAt: new Date() },
      });
      return msg;
    });

    return { message: 'Message envoyé', item: created };
  }

  async listConversations(query: QueryConversationsDto) {
    const page  = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 10);
    if (page < 1 || limit < 1) throw new BadRequestException({ message: 'Page et limit >= 1.' });
    const skip = (page - 1) * limit;

    const where: Prisma.ConversationWhereInput = {};
    if (query.medecinId) where.medecinId = query.medecinId;
    if (query.patientId) where.patientId = query.patientId;
    if (query.unreadOnly && query.forUserId) {
      where.messages = { some: { receiverId: query.forUserId, isRead: false } };
    }

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.conversation.findMany({
        where,
        skip,
        take: limit,
        orderBy: { lastMessageAt: 'desc' },
        include: {
          medecin: { select: { userId: true, firstName: true, lastName: true } },
          patient: { select: { userId: true, firstName: true, lastName: true } },
          messages: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
      }),
      this.prisma.conversation.count({ where }),
    ]);

    let unreadMap: Record<number, number> = {};
    if (query.forUserId && rows.length) {
      const grouped = await this.prisma.message.groupBy({
        by: ['conversationId'],
        where: {
          conversationId: { in: rows.map(r => r.conversationId) },
          receiverId: query.forUserId,
          isRead: false,
        },
        _count: { _all: true },
      });
      unreadMap = Object.fromEntries(grouped.map(g => [g.conversationId!, g._count._all]));
    }

    const items = rows.map(r => ({
      conversationId: r.conversationId,
      medecin: r.medecin,
      patient: r.patient,
      lastMessageAt: r.lastMessageAt,
      lastMessage: r.messages[0] ?? null,
      unreadCountForUser: query.forUserId ? (unreadMap[r.conversationId] ?? 0) : 0,
    }));

    return { message: 'Conversations récupérées.', items,
      meta: { total, page, limit, lastPage: Math.ceil(total / limit) } };
  }

  async listMessages(conversationId: number, query: QueryMessagesDto) {
    const page  = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 20);
    if (page < 1 || limit < 1) throw new BadRequestException({ message: 'Page et limit >= 1.' });
    const conv = await this.prisma.conversation.findUnique({ where: { conversationId } });
    if (!conv) throw new NotFoundException({ message: `Conversation ${conversationId} introuvable.` });
    if (query.forUserId && query.forUserId !== conv.medecinId && query.forUserId !== conv.patientId) {
      throw new ForbiddenException({ message: `Vous n'êtes pas participant de cette conversation.` });
    }

    const skip = (page - 1) * limit;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.message.findMany({
        where: { conversationId },
        skip, take: limit,
        orderBy: { createdAt: 'asc' },
        select: {
          messageId: true, senderId: true, receiverId: true, kind: true,
          content: true, meta: true, isRead: true, createdAt: true,
        },
      }),
      this.prisma.message.count({ where: { conversationId } }),
    ]);

    return { message: 'Messages récupérés.', items,
      meta: { total, page, limit, lastPage: Math.ceil(total / limit) } };
  }

  async markConversationRead(conversationId: number, readerId: number) {
    const conv = await this.prisma.conversation.findUnique({ where: { conversationId } });
    if (!conv) throw new NotFoundException({ message: `Conversation ${conversationId} introuvable.` });
    if (readerId !== conv.medecinId && readerId !== conv.patientId) {
      throw new ForbiddenException({ message: `Vous n'êtes pas participant de cette conversation.` });
    }
    const res = await this.prisma.message.updateMany({
      where: { conversationId, receiverId: readerId, isRead: false },
      data: { isRead: true },
    });
    return { message: `Conversation marquée comme lue (${res.count} message(s)).`, updated: res.count };
  }

  async getConversationAndMarkRead(conversationId: number, query: QueryConversationDetailDto) {
    const readerId = Number(query.readerId);
    if (!readerId || isNaN(readerId)) {
      throw new BadRequestException({ message: 'readerId est requis et doit être un entier.' });
    }

    const conv = await this.prisma.conversation.findUnique({
      where: { conversationId },
      include: {
        medecin: { select: { userId: true, firstName: true, lastName: true } },
        patient: { select: { userId: true, firstName: true, lastName: true } },
      },
    });
    if (!conv) throw new NotFoundException({ message: `Conversation ${conversationId} introuvable.` });
    // if (readerId !== conv.medecinId && readerId !== conv.patientId) {
    //   throw new ForbiddenException({ message: `Accès refusé à la conversation ${conversationId}.` });
    // }

    await this.prisma.message.updateMany({
      where: { conversationId, isRead: false, NOT: { senderId: readerId } },
      data: { isRead: true },
    });

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    if (page < 1 || limit < 1) throw new BadRequestException({ message: 'Page et limit >= 1.' });
    const skip = (page - 1) * limit;

    const [messages, total, unreadCount] = await this.prisma.$transaction([
      this.prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'desc' },
        skip, take: limit,
        select: {
          messageId: true, senderId: true, receiverId: true, kind: true,
          content: true, meta: true, isRead: true, createdAt: true,
        },
      }),
      this.prisma.message.count({ where: { conversationId } }),
      this.prisma.message.count({
        where: { conversationId, isRead: false, NOT: { senderId: readerId } },
      }),
    ]);

    return {
      message: 'Conversation récupérée et marquée comme lue.',
      conversation: conv,
      items: messages,
      meta: { total, page, limit, lastPage: Math.ceil(total / limit), unreadForReader: unreadCount },
    };
  }

  async getUnreadOverview(forUserId: number) {
    const u = await this.prisma.user.findUnique({ where: { userId: forUserId } });
    if (!u) throw new NotFoundException({ message: `User ${forUserId} introuvable` });

    const dmCounts = await this.prisma.message.groupBy({
      by: ['conversationId'],
      where: { receiverId: forUserId, isRead: false, conversationId: { not: null } },
      _count: { _all: true },
    });
    const dmMap = Object.fromEntries(
      dmCounts.filter(x => x.conversationId !== null).map(x => [x.conversationId!, x._count._all])
    );

    // cas difficiles : compteur sera exposé côté module cas-difficiles (ici juste l’overview DM)
    return { forUserId, dm: dmMap, totals: { dmTotal: Object.values(dmMap).reduce((a,b)=>a+b,0) } };
  }

  /* ------------------ FICHES dans DM ------------------ */
  async sendFicheRequest(dto: SendFicheRequestDto) {
    const [fiche, conv] = await Promise.all([
      this.prisma.ficheStructuree.findUnique({ where: { ficheId: dto.ficheId }, include: { questions: true } }),
      this.prisma.conversation.findUnique({ where: { conversationId: dto.conversationId } }),
    ]);
    if (!fiche) throw new NotFoundException({ message: 'Fiche introuvable' });
    if (!conv) throw new NotFoundException({ message: 'Conversation introuvable' });

    if (dto.senderId !== conv.medecinId) {
      throw new ForbiddenException({ message: 'Seul le médecin de la conversation peut envoyer la fiche.' });
    }

    const msg = await this.prisma.$transaction(async (tx) => {
      const created = await tx.message.create({
        data: {
          kind: 'FICHE_REQUEST',
          conversationId: conv.conversationId,
          senderId: dto.senderId,
          receiverId: conv.patientId,
          ficheId: fiche.ficheId,
          isRead: false,
        },
        include: {
          fiche: { include: { questions: { orderBy: { orderIndex: 'asc' } } } },
        },
      });
      await tx.conversation.update({
        where: { conversationId: conv.conversationId },
        data: { lastMessageAt: new Date() },
      });
      return created;
    });

    return { message: 'Fiche demandée', item: msg };
  }

  // async submitFicheResponse(dto: SubmitFicheResponseDto) {
  //   const [fiche, conv] = await Promise.all([
  //     this.prisma.ficheStructuree.findUnique({ where: { ficheId: dto.ficheId }, include: { questions: true } }),
  //     this.prisma.conversation.findUnique({ where: { conversationId: dto.conversationId } }),
  //   ]);
  //   if (!fiche) throw new NotFoundException({ message: 'Fiche introuvable' });
  //   if (!conv) throw new NotFoundException({ message: 'Conversation introuvable' });

  //   if (dto.senderId !== conv.medecinId && dto.senderId !== conv.patientId) {
  //     throw new ForbiddenException({ message: `Vous n'êtes pas participant de cette conversation.` });
  //   }

  //   const qIds = new Set(fiche.questions.map(q => q.ficheQuestionId));
  //   for (const a of dto.answers) {
  //     if (!qIds.has(a.questionId)) {
  //       throw new BadRequestException({ message: `questionId ${a.questionId} n'appartient pas à cette fiche` });
  //     }
  //     if (!a.valueText || !a.valueText.trim()) {
  //       throw new BadRequestException({ message: `Réponse texte requise pour question ${a.questionId}` });
  //     }
  //   }

  //   const receiverId = dto.senderId === conv.medecinId ? conv.patientId : conv.medecinId;

  //   const out = await this.prisma.$transaction(async (tx) => {
  //     const r = await tx.ficheReponse.create({
  //       data: {
  //         ficheId: fiche.ficheId,
  //         conversationId: conv.conversationId,
  //         senderId: dto.senderId,
  //         submittedForUserId: dto.submittedForUserId ?? null,
  //         items: { create: dto.answers.map(a => ({ questionId: a.questionId, valueText: a.valueText.trim() })) },
  //       },
  //       include: { items: true },
  //     });

  //     const msg = await tx.message.create({
  //       data: {
  //         kind: 'FICHE_RESPONSE',
  //         conversationId: conv.conversationId,
  //         senderId: dto.senderId,
  //         receiverId,
  //         ficheReponseId: r.ficheReponseId, // unique
  //         meta: dto.requestMessageId ? ({ respondingTo: dto.requestMessageId } as Prisma.InputJsonValue) : undefined,
  //         isRead: false,
  //       },
  //     });

  //     await tx.conversation.update({
  //       where: { conversationId: conv.conversationId },
  //       data: { lastMessageAt: new Date() },
  //     });

  //     return { r, msg };
  //   });

  //   return { response: out.r, message: out.msg };
  // }
// src/messageries/dm.service.ts (remplace complètement la méthode)
async submitFicheResponse(dto: SubmitFicheResponseDto) {
  const [fiche, conv] = await Promise.all([
    this.prisma.ficheStructuree.findUnique({
      where: { ficheId: dto.ficheId },
      include: { questions: true },
    }),
    this.prisma.conversation.findUnique({
      where: { conversationId: dto.conversationId },
    }),
  ]);
  if (!fiche) throw new NotFoundException({ message: 'Fiche introuvable' });
  if (!conv) throw new NotFoundException({ message: 'Conversation introuvable' });

  if (dto.senderId !== conv.medecinId && dto.senderId !== conv.patientId) {
    throw new ForbiddenException({ message: `Vous n'êtes pas participant de cette conversation.` });
  }

  const qIds = new Set(fiche.questions.map(q => q.ficheQuestionId));
  for (const a of dto.answers) {
    if (!qIds.has(a.questionId)) {
      throw new BadRequestException({ message: `questionId ${a.questionId} n'appartient pas à cette fiche` });
    }
    if (!a.valueText || !a.valueText.trim()) {
      throw new BadRequestException({ message: `Réponse texte requise pour question ${a.questionId}` });
    }
  }

  const receiverId = dto.senderId === conv.medecinId ? conv.patientId : conv.medecinId;

  // ⬇️ Transaction MINIMALE (création réponse + message) + timeout augmenté
  const createdResponse = await this.prisma.$transaction(async (tx) => {
    const r = await tx.ficheReponse.create({
      data: {
        ficheId: fiche.ficheId,
        conversationId: conv.conversationId,
        senderId: dto.senderId,
        submittedForUserId: dto.submittedForUserId ?? null,
        items: {
          create: dto.answers.map(a => ({
            questionId: a.questionId,
            valueText: a.valueText.trim(),
          })),
        },
      },
      // ⚠️ pas d'include ici pour réduire la durée de la transaction
    });

    await tx.message.create({
      data: {
        kind: 'FICHE_RESPONSE',
        conversationId: conv.conversationId,
        senderId: dto.senderId,
        receiverId,
        ficheReponseId: r.ficheReponseId,
        meta: dto.requestMessageId
          ? ({ respondingTo: dto.requestMessageId } as Prisma.InputJsonValue)
          : undefined,
        isRead: false,
      },
    });

    return r;
  }, { maxWait: 10_000, timeout: 20_000 }); // ⬅️ augmente les limites (10s d’attente du slot, 20s de durée)

  // ⬇️ Mise à jour “cosmétique” hors transaction (pas besoin d’atomicité forte)
  this.prisma.conversation.update({
    where: { conversationId: conv.conversationId },
    data: { lastMessageAt: new Date() },
  }).catch(() => void 0); // éviter de casser la réponse en cas de latence

  // ⬇️ Recharge propre pour la réponse complète (hors transaction)
  const response = await this.prisma.ficheReponse.findUnique({
    where: { ficheReponseId: createdResponse.ficheReponseId },
    include: {
      fiche: true,
      items: true,
      sender: { select: { userId: true, firstName: true, lastName: true } },
    },
  });

  return { response };
}

  async listFicheResponsesByConversation(conversationId: number) {
    const items = await this.prisma.ficheReponse.findMany({
      where: { conversationId },
      include: {
        fiche: true,
        items: true,
        sender: { select: { userId: true, firstName: true, lastName: true } },
      },
      orderBy: { submittedAt: 'desc' },
    });
    return { items };
  }
}

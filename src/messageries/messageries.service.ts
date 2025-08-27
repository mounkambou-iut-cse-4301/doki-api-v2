// src/messageries/messageries.service.ts
import {
  BadRequestException, ForbiddenException, Injectable, NotFoundException,
} from '@nestjs/common';
import { Prisma, UserType } from 'generated/prisma';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { QueryConversationDetailDto } from './dto/query-conversation-detail.dto';

export class QueryConversationsDto {
  medecinId?: number;
  patientId?: number;
  forUserId?: number;     // pour calculer les non-lus et/ou filtrer unreadOnly
  unreadOnly?: boolean;
  page?: number;
  limit?: number;
}

export class QueryMessagesDto {
  forUserId?: number;     // optionnel (pour vérifier participation / stats)
  page?: number;
  limit?: number;
}

@Injectable()
export class MessageriesService {
  constructor(private readonly prisma: PrismaService) {}

  // ----- helpers
  private async getOrCreateConversation(medecinId: number, patientId: number) {
    const [med, pat] = await Promise.all([
      this.prisma.user.findUnique({ where: { userId: medecinId } }),
      this.prisma.user.findUnique({ where: { userId: patientId } }),
    ]);
    if (!med || med.userType !== UserType.MEDECIN) {
      throw new NotFoundException({
        message: `Médecin ${medecinId} introuvable.`,
        messageE: `Doctor ${medecinId} not found.`,
      });
    }
    if (!pat || pat.userType !== UserType.PATIENT) {
      throw new NotFoundException({
        message: `Patient ${patientId} introuvable.`,
        messageE: `Patient ${patientId} not found.`,
      });
    }

    const existing = await this.prisma.conversation.findUnique({
      where: { medecinId_patientId: { medecinId, patientId } },
    });
    if (existing) return existing;

    return this.prisma.conversation.create({
      data: { medecinId, patientId, lastMessageAt: new Date() },
    });
  }

  // ----- envoyer un message (sans @Req : senderId est passé explicitement)
  async sendMessage(senderId: number, dto: CreateMessageDto) {
    if (senderId !== dto.medecinId && senderId !== dto.patientId) {
      throw new ForbiddenException({
        message: `Vous ne faites pas partie de cette conversation.`,
        messageE: `You are not a participant of this conversation.`,
      });
    }

    const hasForm = dto.form && Object.keys(dto.form).length > 0;
    const hasText = !!dto.content && dto.content.trim().length > 0;
    if (!hasForm && !hasText) {
      throw new BadRequestException({
        message: `Fournissez un message texte ou une fiche structurée (form).`,
        messageE: `Provide either text content or a structured form payload.`,
      });
    }

    const conv = await this.getOrCreateConversation(dto.medecinId, dto.patientId);
    const receiverId = senderId === dto.medecinId ? dto.patientId : dto.medecinId;

    const message = await this.prisma.$transaction(async (tx) => {
      const created = await tx.message.create({
        data: {
          conversationId: conv.conversationId,
          senderId,
          receiverId,
          content: hasText ? dto.content!.trim() : undefined,
          // ⬇️ IMPORTANT: pas de null ici, on omet la propriété si pas de form
meta: hasForm ? (dto.form as unknown as Prisma.InputJsonValue) : undefined,
          isRead: false,
        },
      });
      await tx.conversation.update({
        where: { conversationId: conv.conversationId },
        data: { lastMessageAt: new Date() },
      });
      return created;
    });

    return {
      message: 'Message envoyé avec succès.',
      messageE: 'Message sent successfully.',
      item: message,
    };
  }

  // ----- lister les conversations (1 seul argument: query)
  async listConversations(query: QueryConversationsDto) {
    const page  = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 10);
    if (page < 1 || limit < 1) {
      throw new BadRequestException({
        message: 'Page et limit doivent être >= 1.',
        messageE: 'Page and limit must be >= 1.',
      });
    }
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

    // compteur non-lus par conversation pour forUserId
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
      unreadMap = Object.fromEntries(grouped.map(g => [g.conversationId, g._count._all]));
    }

    const items = rows.map(r => ({
      conversationId: r.conversationId,
      medecin: r.medecin,
      patient: r.patient,
      lastMessageAt: r.lastMessageAt,
      lastMessage: r.messages[0] ?? null,
      unreadCountForUser: query.forUserId ? (unreadMap[r.conversationId] ?? 0) : 0,
    }));

    return {
      message: 'Conversations récupérées.',
      messageE: 'Conversations fetched.',
      items,
      meta: { total, page, limit, lastPage: Math.ceil(total / limit) },
    };
  }

  // ----- lister les messages d’une conversation (NOUVEAU)
  async listMessages(conversationId: number, query: QueryMessagesDto) {
    const page  = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 20);
    if (page < 1 || limit < 1) {
      throw new BadRequestException({
        message: 'Page et limit doivent être >= 1.',
        messageE: 'Page and limit must be >= 1.',
      });
    }
    const conv = await this.prisma.conversation.findUnique({ where: { conversationId } });
    if (!conv) {
      throw new NotFoundException({
        message: `Conversation ${conversationId} introuvable.`,
        messageE: `Conversation ${conversationId} not found.`,
      });
    }
    // Optionnel: si forUserId fourni, vérifier qu’il participe à la conversation
    if (query.forUserId && query.forUserId !== conv.medecinId && query.forUserId !== conv.patientId) {
      throw new ForbiddenException({
        message: `Vous n'êtes pas participant de cette conversation.`,
        messageE: `You are not a participant of this conversation.`,
      });
    }

    const skip = (page - 1) * limit;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.message.findMany({
        where: { conversationId },
        skip,
        take: limit,
        orderBy: { createdAt: 'asc' }, // chronologique
        select: {
          messageId: true,
          senderId: true,
          receiverId: true,
          content: true,
          meta: true,
          isRead: true,
          createdAt: true,
        },
      }),
      this.prisma.message.count({ where: { conversationId } }),
    ]);

    return {
      message: 'Messages récupérés.',
      messageE: 'Messages fetched.',
      items,
      meta: { total, page, limit, lastPage: Math.ceil(total / limit) },
    };
  }

  // ----- marquer une conversation comme lue
  async markConversationRead(conversationId: number, readerId: number) {
    const conv = await this.prisma.conversation.findUnique({ where: { conversationId } });
    if (!conv) {
      throw new NotFoundException({
        message: `Conversation ${conversationId} introuvable.`,
        messageE: `Conversation ${conversationId} not found.`,
      });
    }
    if (readerId !== conv.medecinId && readerId !== conv.patientId) {
      throw new ForbiddenException({
        message: `Vous n'êtes pas participant de cette conversation.`,
        messageE: `You are not a participant of this conversation.`,
      });
    }
    const res = await this.prisma.message.updateMany({
      where: { conversationId, receiverId: readerId, isRead: false },
      data: { isRead: true },
    });
    return {
      message: `Conversation marquée comme lue (${res.count} message(s)).`,
      messageE: `Conversation marked as read (${res.count} message(s)).`,
      updated: res.count,
    };
  }

  /**
   * Récupère une conversation et marque TOUTES les réponses reçues comme lues pour `readerId`.
   * Tri des messages: du plus récent au plus ancien (DESC).
   */
async getConversationAndMarkRead(
    conversationId: number,
    query: QueryConversationDetailDto,
) {
    try {
        const readerId = Number(query.readerId);
        if (!readerId || isNaN(readerId)) {
            throw new BadRequestException({
                message: 'readerId est requis et doit être un entier.',
                messageE: 'readerId is required and must be an integer.',
            });
        }

        const conv = await this.prisma.conversation.findUnique({
            where: { conversationId },
            include: {medecin:{select:{firstName:true,lastName:true}},patient:{select:{firstName:true,lastName:true}}},
        });
        if (!conv) {
            throw new NotFoundException({
                message: `Conversation ${conversationId} introuvable.`,
                messageE: `Conversation ${conversationId} not found.`,
            });
        }
        if (readerId !== conv.medecinId && readerId !== conv.patientId) {
            throw new ForbiddenException({
                message: `Accès refusé à la conversation ${conversationId}.`,
                messageE: `Access denied to conversation ${conversationId}.`,
            });
        }

        await this.prisma.message.updateMany({
            where: {
                conversationId,
                isRead: false,
                NOT: { senderId: readerId },
            },
            data: { isRead: true },
        });

        const page = query.page ? Number(query.page) : 1; // Ensure page is an integer
        const limit = query.limit ? Number(query.limit) : 20; // Ensure limit is an integer
        if (page < 1 || limit < 1) {
            throw new BadRequestException({
                message: 'Page et limit doivent être >= 1.',
                messageE: 'Page and limit must be >= 1.',
            });
        }
        const skip = (page - 1) * limit;

        const [messages, total, unreadCount] = await this.prisma.$transaction([
            this.prisma.message.findMany({
                where: { conversationId },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit, // Pass the integer limit here
                            include: {sender:{select:{firstName:true,lastName:true}},receiver:{select:{firstName:true,lastName:true}}},

            }),
            this.prisma.message.count({ where: { conversationId } }),
            this.prisma.message.count({
                where: {
                    conversationId,
                    isRead: false,
                    NOT: { senderId: readerId },
                },
            }),
        ]);

        return {
            message: 'Conversation récupérée et marquée comme lue.',
            messageE: 'Conversation fetched and marked as read.',
            conversation: conv,
            items: messages,
            meta: {
                total,
                page,
                limit,
                lastPage: Math.ceil(total / limit),
                unreadForReader: unreadCount,
            },
        };
    } catch (error) {
        if (
            error instanceof BadRequestException ||
            error instanceof NotFoundException ||
            error instanceof ForbiddenException
        ) throw error;
        throw new BadRequestException({
            message: `Erreur récupération conversation : ${error.message}`,
            messageE: `Error fetching conversation: ${error.message}`,
        });
    }
}
}

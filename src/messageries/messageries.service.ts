// // import {
// //   BadRequestException, ForbiddenException, Injectable, NotFoundException,
// // } from '@nestjs/common';
// // import { PrismaService } from 'src/prisma/prisma.service';
// // import { SendDmMessageDto } from './dto/send-dm-message.dto';
// // import { QueryConversationsDto } from './dto/query-conversations.dto';
// // import { QueryMessagesDto } from 'src/common/dto/query-messages.dto';
// // import { SendFicheRequestDto } from './dto/send-fiche-request.dto';
// // import { SubmitFicheResponseDto } from './dto/submit-fiche-response.dto';
// // import { QueryConversationDetailDto } from './dto/query-conversation-detail.dto';
// // import { randomUUID } from 'crypto';
// // import { bi, isValidExpoToken, sendExpoPush } from 'src/utils/expo-push';
// // import { QuerySummaryAiDto } from './dto/query-summary-ai.dto';
// // import { GeminiService } from 'src/ai/gemini/gemini.service';
// // import { OpenaiService } from 'src/ai/ai.service';
// // import { AiProvider } from './dto/explain-question.dto';
// // import { buildExplainQuestionPrompt } from 'src/ai/explain-question.prompt';
// // import { FicheQuestion } from 'src/fiches/types/fiche-question.type';



// // @Injectable()
// // export class MessageriesService {
// //   constructor(private readonly prisma: PrismaService, private readonly openai: OpenaiService, private readonly gemini: GeminiService
// // ) {}

// //   // /* ------------------ Helpers ------------------ */
// //   // private async getOrCreateConversation(medecinId: number, patientId: number) {
// //   //   const [med, pat] = await Promise.all([
// //   //     this.prisma.user.findUnique({ where: { userId: medecinId } }),
// //   //     this.prisma.user.findUnique({ where: { userId: patientId } }),
// //   //   ]);
// //   //   if (!med || med.userType !== 'MEDECIN') {
// //   //     throw new NotFoundException({ message: `Médecin ${medecinId} introuvable.` });
// //   //   }
// //   //   if (!pat || pat.userType !== 'PATIENT') {
// //   //     throw new NotFoundException({ message: `Patient ${patientId} introuvable.` });
// //   //   }
// //   //   const existing = await this.prisma.conversation.findUnique({
// //   //     where: { medecinId_patientId: { medecinId, patientId } },
// //   //   });
// //   //   if (existing) return existing;
// //   //   return this.prisma.conversation.create({
// //   //     data: { medecinId, patientId, lastMessageAt: new Date() },
// //   //   });
// //   // }

// //   // /* ------------------ DM basiques ------------------ */
// //   // async sendDmMessage(senderId: number, dto: SendDmMessageDto) {
// //   //   if (senderId !== dto.medecinId && senderId !== dto.patientId) {
// //   //     throw new ForbiddenException({ message: `Vous ne faites pas partie de cette conversation.` });
// //   //   }
// //   //   const hasText = !!dto.content && dto.content.trim().length > 0;
// //   //   const hasMeta = dto.meta && Object.keys(dto.meta).length > 0;
// //   //   if (!hasText && !hasMeta) {
// //   //     throw new BadRequestException({ message: `Fournissez un message texte ou des métadonnées.` });
// //   //   }

// //   //   const conv = await this.getOrCreateConversation(dto.medecinId, dto.patientId);
// //   //   const receiverId = senderId === dto.medecinId ? dto.patientId : dto.medecinId;

// //   //   const created = await this.prisma.$transaction(async (tx) => {
// //   //     const msg = await tx.message.create({
// //   //       data: {
// //   //         kind: hasMeta && !hasText ? 'SYSTEM' : 'TEXT',
// //   //         conversationId: conv.conversationId,
// //   //         senderId,
// //   //         receiverId,
// //   //         content: hasText ? dto.content!.trim() : undefined,
// //   //         meta: hasMeta ? (dto.meta as any) : undefined,
// //   //         isRead: false,
// //   //       },
// //   //     });
// //   //     await tx.conversation.update({
// //   //       where: { conversationId: conv.conversationId },
// //   //       data: { lastMessageAt: new Date() },
// //   //     });
// //   //     return msg;
// //   //   });

// //   //   return { message: 'Message envoyé', item: created };
// //   // }

// //   private async getOrCreateConversation(medecinId: number, patientId: number) {
// //     const [med, pat] = await Promise.all([
// //       this.prisma.user.findUnique({ where: { userId: medecinId } }),
// //       this.prisma.user.findUnique({ where: { userId: patientId } }),
// //     ]);
// //     if (!med || med.userType !== 'MEDECIN') throw new NotFoundException({ message: `Médecin ${medecinId} introuvable.` });
// //     if (!pat || pat.userType !== 'PATIENT') throw new NotFoundException({ message: `Patient ${patientId} introuvable.` });

// //     const existing = await this.prisma.conversation.findUnique({
// //       where: { medecinId_patientId: { medecinId, patientId } },
// //     });
// //     if (existing) return existing;
// //     return this.prisma.conversation.create({ data: { medecinId, patientId, lastMessageAt: new Date() } });
// //   }

// //   private async createNotification(userId: number, titleFr: string, titleEn: string, msgFr: string, msgEn: string) {
// //     return this.prisma.notification.create({
// //       data: { userId, title: bi(titleFr, titleEn), message: bi(msgFr, msgEn), isRead: false },
// //     });
// //   }

// //   /* ------------------ DM basiques ------------------ */
// //   async sendDmMessage(senderId: number, dto: SendDmMessageDto) {
// //     if (senderId !== dto.medecinId && senderId !== dto.patientId) {
// //       throw new ForbiddenException({ message: `Vous ne faites pas partie de cette conversation.` });
// //     }
// //     const hasText = !!dto.content && dto.content.trim().length > 0;
// //     const hasMeta = dto.meta && Object.keys(dto.meta).length > 0;
// //     if (!hasText && !hasMeta) {
// //       throw new BadRequestException({ message: `Fournissez un message texte ou des métadonnées.` });
// //     }

// //     const conv = await this.getOrCreateConversation(dto.medecinId, dto.patientId);
// //     const receiverId = senderId === dto.medecinId ? dto.patientId : dto.medecinId;

// //     const created = await this.prisma.$transaction(async (tx) => {
// //       const msg = await tx.message.create({
// //         data: {
// //           kind: hasMeta && !hasText ? 'SYSTEM' : 'TEXT',
// //           conversationId: conv.conversationId,
// //           senderId,
// //           receiverId,
// //           content: hasText ? dto.content!.trim() : undefined,
// //           meta: hasMeta ? (dto.meta as any) : undefined,
// //           isRead: false,
// //         },
// //       });
// //       await tx.conversation.update({
// //         where: { conversationId: conv.conversationId },
// //         data: { lastMessageAt: new Date() },
// //       });
// //       return msg;
// //     });

// //     // 🔔 Push & Notification au destinataire
// //     const [sender, receiver] = await Promise.all([
// //       this.prisma.user.findUnique({ where: { userId: senderId } }),
// //       this.prisma.user.findUnique({ where: { userId: receiverId } }),
// //     ]);

// //     const titleFr = 'Nouveau message';
// //     const titleEn = 'New message';
// //     const bodyFr = hasText ? dto.content!.trim() : 'Vous avez reçu un message.';
// //     const bodyEn = hasText ? dto.content!.trim() : 'You received a message.';

// //     // save Notification (destinataire)
// //     if (receiver) {
// //       void this.createNotification(
// //         receiver.userId,
// //         titleFr, titleEn,
// //         `De ${sender?.firstName ?? ''} ${sender?.lastName ?? ''} — ${bodyFr}`,
// //         `From ${sender?.firstName ?? ''} ${sender?.lastName ?? ''} — ${bodyEn}`,
// //       ).catch(() => void 0);

// //       // push Expo au destinataire si token valide
// //       const token = receiver.expotoken;
// //       if (isValidExpoToken(token)) {
// //         void sendExpoPush({
// //           to: token!,
// //           sound: 'default',
// //           title: bi(titleFr, titleEn),
// //           body: bi(`De ${sender?.firstName ?? ''} ${sender?.lastName ?? ''}: ${bodyFr}`,
// //                    `From ${sender?.firstName ?? ''} ${sender?.lastName ?? ''}: ${bodyEn}`),
// //           data: { kind: 'DM', conversationId: conv.conversationId, messageId: created.messageId },
// //           priority: 'high',
// //         });
// //       }
// //     }

// //     return { message: 'Message envoyé', item: created };
// //   }

// //   // async listConversations(query: QueryConversationsDto) {
// //   //   const page  = Number(query.page ?? 1);
// //   //   const limit = Number(query.limit ?? 10);
// //   //   if (page < 1 || limit < 1) throw new BadRequestException({ message: 'Page et limit >= 1.' });
// //   //   const skip = (page - 1) * limit;

// //   //   const where: any = {};
// //   //   if (query.medecinId) where.medecinId = query.medecinId;
// //   //   if (query.patientId) where.patientId = query.patientId;
// //   //   if (query.unreadOnly && query.forUserId) {
// //   //     where.messages = { some: { receiverId: query.forUserId, isRead: false } };
// //   //   }

// //   //   const [rows, total] = await this.prisma.$transaction([
// //   //     this.prisma.conversation.findMany({
// //   //       where,
// //   //       skip,
// //   //       take: limit,
// //   //       orderBy: { lastMessageAt: 'desc' },
// //   //       include: {
// //   //         medecin: { select: { userId: true, firstName: true, lastName: true, profile: true,phone:true } },
// //   //         patient: { select: { userId: true, firstName: true, lastName: true, profile: true,phone:true } },
// //   //         messages: { orderBy: { createdAt: 'desc' }, take: 1 },
// //   //       },
// //   //     }),
// //   //     this.prisma.conversation.count({ where }),
// //   //   ]);

// //   //   let unreadMap: Record<number, number> = {};
// //   //   if (query.forUserId && rows.length) {
// //   //     const grouped = await this.prisma.message.groupBy({
// //   //       by: ['conversationId'],
// //   //       where: {
// //   //         conversationId: { in: rows.map(r => r.conversationId) },
// //   //         receiverId: query.forUserId,
// //   //         isRead: false,
// //   //       },
// //   //       _count: { _all: true },
// //   //     });
// //   //     unreadMap = Object.fromEntries(grouped.map(g => [g.conversationId!, g._count._all]));
// //   //   }

// //   //   const items = rows.map(r => ({
// //   //     conversationId: r.conversationId,
// //   //     medecin: r.medecin,
// //   //     patient: r.patient,
// //   //     lastMessageAt: r.lastMessageAt,
// //   //     lastMessage: r.messages[0] ?? null,
// //   //     unreadCountForUser: query.forUserId ? (unreadMap[r.conversationId] ?? 0) : 0,
// //   //   }));

// //   //   return { message: 'Conversations récupérées.', items,
// //   //     meta: { total, page, limit, lastPage: Math.ceil(total / limit) } };
// //   // }
// //   async listConversations(query: QueryConversationsDto) {
// //   const page  = Number(query.page ?? 1);
// //   const limit = Number(query.limit ?? 10);
// //   if (page < 1 || limit < 1) {
// //     throw new BadRequestException({ message: 'Page et limit >= 1.' });
// //   }
// //   const skip = (page - 1) * limit;

// //   const where: any = {};
// //   if (query.medecinId) where.medecinId = query.medecinId;
// //   if (query.patientId) where.patientId = query.patientId;
// //   if (query.unreadOnly && query.forUserId) {
// //     where.messages = { some: { receiverId: query.forUserId, isRead: false } };
// //   }

// //   const [rows, total] = await this.prisma.$transaction([
// //     this.prisma.conversation.findMany({
// //       where,
// //       skip,
// //       take: limit,
// //       orderBy: { lastMessageAt: 'desc' },
// //       include: {
// //         medecin: {
// //           select: {
// //             userId: true,
// //             firstName: true,
// //             lastName: true,
// //             profile: true,
// //             phone: true,
// //           },
// //         },
// //         patient: {
// //           select: {
// //             userId: true,
// //             firstName: true,
// //             lastName: true,
// //             profile: true,
// //             phone: true,
// //           },
// //         },
// //         messages: { orderBy: { createdAt: 'desc' }, take: 1 },
// //       },
// //     }),
// //     this.prisma.conversation.count({ where }),
// //   ]);

// //   // ====== Unread map (inchangé) ======
// //   let unreadMap: Record<number, number> = {};
// //   if (query.forUserId && rows.length) {
// //     const grouped = await this.prisma.message.groupBy({
// //       by: ['conversationId'],
// //       where: {
// //         conversationId: { in: rows.map(r => r.conversationId) },
// //         receiverId: query.forUserId,
// //         isRead: false,
// //       },
// //       _count: { _all: true },
// //     });
// //     unreadMap = Object.fromEntries(
// //       grouped.map(g => [g.conversationId!, g._count._all]),
// //     );
// //   }

// //   // ====== Map de la dernière réservation passée la plus proche ======
// //   let reservationMap: Record<number, number | null> = {};

// //   if (rows.length) {
// //     const now = new Date();
// //     const todayStr = now.toISOString().slice(0, 10); // 'YYYY-MM-DD'
// //     const timeStr  = now.toTimeString().slice(0, 5); // 'HH:MM'

// //     // Toutes les réservations DÉJÀ PASSÉES pour les couples (medecinId, patientId)
// //     const pastReservations = await this.prisma.reservation.findMany({
// //       where: {
// //         AND: [
// //           {
// //             OR: rows.map(r => ({
// //               medecinId: r.medecinId,
// //               patientId: r.patientId,
// //             })),
// //           },
// //           {
// //             OR: [
// //               // Date strictement avant aujourd'hui
// //               { date: { lt: todayStr } },
// //               // Même jour mais heure <= maintenant
// //               {
// //                 date: todayStr,
// //                 hour: { lte: timeStr },
// //               },
// //             ],
// //           },
// //         ],
// //         // 👇 On ne filtre PAS sur status (peu importe le status)
// //       },
// //       orderBy: [
// //         { date: 'desc' }, // plus récent d'abord
// //         { hour: 'desc' },
// //       ],
// //       select: {
// //         reservationId: true,
// //         medecinId: true,
// //         patientId: true,
// //         date: true,
// //         hour: true,
// //       },
// //     });

// //     // Pour chaque conversation : première réservation correspondante dans la liste triée (donc la plus récente dans le passé)
// //     for (const conv of rows) {
// //       const match = pastReservations.find(
// //         r =>
// //           r.medecinId === conv.medecinId &&
// //           r.patientId === conv.patientId,
// //       );
// //       reservationMap[conv.conversationId] = match?.reservationId ?? null;
// //     }
// //   }

// //   // ====== Construction des items de réponse ======
// //   const items = rows.map(r => ({
// //     conversationId: r.conversationId,
// //     medecin: r.medecin,
// //     patient: r.patient,
// //     lastMessageAt: r.lastMessageAt,
// //     lastMessage: r.messages[0] ?? null,
// //     unreadCountForUser: query.forUserId
// //       ? (unreadMap[r.conversationId] ?? 0)
// //       : 0,
// //     // 👇 La réservation DÉJÀ PASSÉE, la plus proche de maintenant
// //     lastReservationId: reservationMap[r.conversationId] ?? null,
// //   }));

// //   return {
// //     message: 'Conversations récupérées.',
// //     items,
// //     meta: {
// //       total,
// //       page,
// //       limit,
// //       lastPage: Math.ceil(total / limit),
// //     },
// //   };
// // }


// //   async listMessages(conversationId: number, query: QueryMessagesDto) {
// //     const page  = Number(query.page ?? 1);
// //     const limit = Number(query.limit ?? 20);
// //     if (page < 1 || limit < 1) throw new BadRequestException({ message: 'Page et limit >= 1.' });
// //     const conv = await this.prisma.conversation.findUnique({ where: { conversationId } });
// //     if (!conv) throw new NotFoundException({ message: `Conversation ${conversationId} introuvable.` });
// //     if (query.forUserId && query.forUserId !== conv.medecinId && query.forUserId !== conv.patientId) {
// //       throw new ForbiddenException({ message: `Vous n'êtes pas participant de cette conversation.` });
// //     }

// //     const skip = (page - 1) * limit;

// //     const [items, total] = await this.prisma.$transaction([
// //       this.prisma.message.findMany({
// //         where: { conversationId },
// //         skip, take: limit,
// //         orderBy: { createdAt: 'desc' },
// //         select: {
// //           messageId: true, senderId: true, receiverId: true, kind: true,
// //           content: true, meta: true, isRead: true, createdAt: true, ficheId: true,
// //           sender: { select: { userId: true, firstName: true, lastName: true, profile: true } },
// //           receiver: { select: { userId: true, firstName: true, lastName: true, profile: true } },
// //         },
// //       }),
// //       this.prisma.message.count({ where: { conversationId } }),
// //     ]);

// //     return { message: 'Messages récupérés.', items,
// //       meta: { total, page, limit, lastPage: Math.ceil(total / limit) } };
// //   }

// //   async markConversationRead(conversationId: number, readerId: number) {
// //     const conv = await this.prisma.conversation.findUnique({ where: { conversationId } });
// //     if (!conv) throw new NotFoundException({ message: `Conversation ${conversationId} introuvable.` });
// //     if (readerId !== conv.medecinId && readerId !== conv.patientId) {
// //       throw new ForbiddenException({ message: `Vous n'êtes pas participant de cette conversation.` });
// //     }
// //     const res = await this.prisma.message.updateMany({
// //       where: { conversationId, receiverId: readerId, isRead: false },
// //       data: { isRead: true },
// //     });
// //     return { message: `Conversation marquée comme lue (${res.count} message(s)).`, updated: res.count };
// //   }

// //   async getConversationAndMarkRead(conversationId: number, query: QueryConversationDetailDto) {
// //     const readerId = Number(query.readerId);
// //     if (!readerId || isNaN(readerId)) {
// //       throw new BadRequestException({ message: 'readerId est requis et doit être un entier.' });
// //     }

// //     const conv = await this.prisma.conversation.findUnique({
// //       where: { conversationId },
// //       include: {
// //         medecin: { select: { userId: true, firstName: true, lastName: true } },
// //         patient: { select: { userId: true, firstName: true, lastName: true } },
// //       },
// //     });
// //     if (!conv) throw new NotFoundException({ message: `Conversation ${conversationId} introuvable.` });

// //     await this.prisma.message.updateMany({
// //       where: { conversationId, isRead: false, NOT: { senderId: readerId } },
// //       data: { isRead: true },
// //     });

// //     const page = query.page ?? 1;
// //     const limit = query.limit ?? 20;
// //     if (page < 1 || limit < 1) throw new BadRequestException({ message: 'Page et limit >= 1.' });
// //     const skip = (page - 1) * limit;

// //     const [messages, total, unreadCount] = await this.prisma.$transaction([
// //       this.prisma.message.findMany({
// //         where: { conversationId },
// //         orderBy: { createdAt: 'desc' },
// //         skip, take: limit,
// //         select: {
// //           messageId: true, senderId: true, receiverId: true, kind: true,
// //           content: true, meta: true, isRead: true, createdAt: true, ficheId: true,
// //         },
// //       }),
// //       this.prisma.message.count({ where: { conversationId } }),
// //       this.prisma.message.count({
// //         where: { conversationId, isRead: false, NOT: { senderId: readerId } },
// //       }),
// //     ]);

// //     return {
// //       message: 'Conversation récupérée et marquée comme lue.',
// //       conversation: conv,
// //       items: messages,
// //       meta: { total, page, limit, lastPage: Math.ceil(total / limit), unreadForReader: unreadCount },
// //     };
// //   }

// //   async getUnreadOverview(forUserId: number) {
// //     const u = await this.prisma.user.findUnique({ where: { userId: forUserId } });
// //     if (!u) throw new NotFoundException({ message: `User ${forUserId} introuvable` });

// //     const dmCounts = await this.prisma.message.groupBy({
// //       by: ['conversationId'],
// //       where: { receiverId: forUserId, isRead: false, conversationId: { not: null } },
// //       _count: { _all: true },
// //     });
// //     const dmMap = Object.fromEntries(
// //       dmCounts.filter(x => x.conversationId !== null).map(x => [x.conversationId!, x._count._all])
// //     );

// //     return { forUserId, dm: dmMap, totals: { dmTotal: Object.values(dmMap).reduce((a,b)=>a+b,0) } };
// //   }

// //   /* ------------------ FICHES : DEMANDE / RÉPONSE ------------------ */
// //   async sendFicheRequest(dto: SendFicheRequestDto) {
// //     const [fiche, conv] = await Promise.all([
// //       this.prisma.fiche.findUnique({ where: { ficheId: dto.ficheId } }),
// //       this.prisma.conversation.findUnique({ where: { conversationId: dto.conversationId } }),
// //     ]);
// //     if (!fiche) throw new NotFoundException({ message: 'Fiche introuvable' });
// //     if (!conv) throw new NotFoundException({ message: 'Conversation introuvable' });

// //     if (dto.senderId !== conv.medecinId) {
// //       throw new ForbiddenException({ message: 'Seul le médecin de la conversation peut envoyer la fiche.' });
// //     }

// //     const msg = await this.prisma.$transaction(async (tx) => {
// //       const created = await tx.message.create({
// //         data: {
// //           kind: 'FICHE_REQUEST',
// //           conversationId: conv.conversationId,
// //           senderId: dto.senderId,
// //           receiverId: conv.patientId,
// //           ficheId: fiche.ficheId,
// //           isRead: false,
// //         },
// //       });
// //       await tx.conversation.update({
// //         where: { conversationId: conv.conversationId },
// //         data: { lastMessageAt: new Date() },
// //       });
// //       return created;
// //     });

// //     return { message: 'Fiche demandée', item: msg };
// //   }

// //   async submitFicheResponse(dto: SubmitFicheResponseDto) {
// //     const [fiche, conv] = await Promise.all([
// //       this.prisma.fiche.findUnique({ where: { ficheId: dto.ficheId } }),
// //       this.prisma.conversation.findUnique({ where: { conversationId: dto.conversationId } }),
// //     ]);
// //     if (!fiche) throw new NotFoundException('Fiche introuvable');
// //     if (!conv) throw new NotFoundException('Conversation introuvable');

// //     if (dto.senderId !== conv.medecinId && dto.senderId !== conv.patientId) {
// //       throw new ForbiddenException(`Vous n'êtes pas participant de cette conversation.`);
// //     }

// //     const questions = (fiche.questions as any[]) || [];
// //     const qMap = new Map(questions.map(q => [q.id, q]));
// //     const items: any[] = [];

// //     for (const a of dto.answers) {
// //       const q = qMap.get(a.questionId);
// //       if (!q) throw new BadRequestException(`questionId ${a.questionId} invalide`);

// //       if (q.type === 'TEXT') {
// //         if (!a.valueText || !a.valueText.trim()) {
// //           throw new BadRequestException(`valueText requis pour TEXT (question ${a.questionId})`);
// //         }
// //         if (a.optionValue) throw new BadRequestException(`optionValue interdit pour TEXT (question ${a.questionId})`);
// //         items.push({ questionId: a.questionId, valueText: a.valueText.trim() });
// //       } else {
// //         if (!a.optionValue) {
// //           throw new BadRequestException(`optionValue requis pour SELECT (question ${a.questionId})`);
// //         }
// //         if (!q.options?.some((o:any) => o.value === a.optionValue)) {
// //           throw new BadRequestException(`optionValue "${a.optionValue}" inconnu pour question ${a.questionId}`);
// //         }
// //         if (a.valueText) throw new BadRequestException(`valueText interdit pour SELECT (question ${a.questionId})`);
// //         items.push({ questionId: a.questionId, optionValue: a.optionValue });
// //       }
// //     }

// //     const response = {
// //       id: randomUUID(),
// //       conversationId: dto.conversationId,
// //       senderId: dto.senderId,
// //       submittedForUserId: dto.submittedForUserId ?? null,
// //       submittedAt: new Date().toISOString(),
// //       items,
// //     };

// //     // read → modify → write
// //     const nextResponses = ([...(fiche.responses as any[] || []), response]);

// //     // 1) sauver dans Fiche.responses
// //     await this.prisma.fiche.update({
// //       where: { ficheId: fiche.ficheId },
// //       data: { responses: nextResponses },
// //     });

// //     // 2) pousser un message DM FICHE_RESPONSE (meta = responseId, ficheId)
// //     const receiverId = dto.senderId === conv.medecinId ? conv.patientId : conv.medecinId;
// //     await this.prisma.message.create({
// //       data: {
// //         kind: 'FICHE_RESPONSE',
// //         conversationId: conv.conversationId,
// //         senderId: dto.senderId,
// //         receiverId,
// //         meta: { responseId: response.id, ficheId: fiche.ficheId, requestMessageId: dto.requestMessageId ?? null },
// //         isRead: false,
// //       } as any,
// //     });

// //     // (optionnel) maj lastMessageAt
// //     this.prisma.conversation.update({
// //       where: { conversationId: conv.conversationId },
// //       data: { lastMessageAt: new Date() },
// //     }).catch(() => void 0);

// //     return { response };
// //   }

// //   // async listFicheResponsesByConversation(conversationId: number) {
// //   //   // scan JSON (filtre app)
// //   //   const fiches = await this.prisma.fiche.findMany();
// //   //   const out: any[] = [];
// //   //   for (const f of fiches) {
// //   //     const rs = (f.responses as any[] || []).filter(r => r.conversationId === conversationId)
// //   //       .map(r => ({ ...r, ficheId: f.ficheId, title: f.title }));
// //   //     out.push(...rs);
// //   //   }
// //   //   out.sort((a,b)=> (b.submittedAt?.localeCompare?.(a.submittedAt) ?? 0));
// //   //   return { items: out };
// //   // }

// //   // =====================================
// //   // 🧠 Génération du résumé d'une conversation
// //   // =====================================
// // // ------------------
// // // 1) listFicheResponsesByConversation (mise à jour)
// // // ------------------
// // async listFicheResponsesByConversation(conversationId: number) {
// //   if (!conversationId || isNaN(conversationId)) {
// //     throw new BadRequestException('conversationId requis et doit être un entier');
// //   }

// //   // récupère toutes les fiches
// //   const fiches = await this.prisma.fiche.findMany();

// //   const out: any[] = [];

// //   for (const f of fiches) {
// //     const questions = (f.questions as any[]) || [];
// //     const responses = (f.responses as any[]) || [];

// //     // sélectionne les réponses qui appartiennent à la conversation
// //     const forConv = responses
// //       .filter(r => r.conversationId === conversationId)
// //       .map(r => {
// //         // enrichir chaque item avec la définition de la question
// //         const enrichedItems = (r.items || []).map((it: any) => {
// //           const q = questions.find(qx => qx.id === it.questionId) || null;
// //           return {
// //             questionId: it.questionId,
// //             optionValue: it.optionValue ?? null,
// //             valueText: it.valueText ?? null,
// //             // définition complète de la question (label, type, options, order, etc.)
// //             question: q,
// //           };
// //         });

// //         return {
// //           ficheId: f.ficheId,
// //           ficheTitle: f.title,
// //           responseId: r.id,
// //           conversationId: r.conversationId,
// //           senderId: r.senderId,
// //           submittedForUserId: r.submittedForUserId ?? null,
// //           submittedAt: r.submittedAt ?? null,
// //           items: enrichedItems,
// //         };
// //       });

// //     out.push(...forConv);
// //   }

// //   // tri descendant par submittedAt (si présent)
// //   out.sort((a, b) => {
// //     const ta = a.submittedAt ? String(a.submittedAt) : '';
// //     const tb = b.submittedAt ? String(b.submittedAt) : '';
// //     return tb.localeCompare(ta);
// //   });

// //   return { items: out };
// // }

// // // ------------------
// // // 2) getFicheQuestionsAndResponses (nouveau)
// // // ------------------
// // /**
// //  * Retourne toutes les questions de la fiche et, pour chaque question,
// //  * toutes les réponses issues de cette fiche appartenant à la conversation.
// //  *
// //  * Format renvoyé:
// //  * {
// //  *   ficheId,
// //  *   ficheTitle,
// //  *   questions: [
// //  *     {
// //  *       question: { id, label, type, order, options?, ... },
// //  *       responses: [
// //  *         { responseId, submittedAt, senderId, submittedForUserId, valueText?, optionValue? }
// //  *       ]
// //  *     }, ...
// //  *   ]
// //  * }
// //  */
// // async getFicheQuestionsAndResponses(conversationId: number, ficheId: number) {
// //   if (!conversationId || isNaN(conversationId) || !ficheId || isNaN(ficheId)) {
// //     throw new BadRequestException('conversationId et ficheId requis et doivent être des entiers');
// //   }

// //   const fiche = await this.prisma.fiche.findUnique({ where: { ficheId } });
// //   if (!fiche) {
// //     // Tu peux préférer lancer NotFoundException; j'opte pour retourner items: {} vide pour usage client plus simple.
// //     // return { ficheId, ficheTitle: null, questions: [] };
// //     throw new NotFoundException(`Fiche ${ficheId} introuvable`);
// //   }

// //   const questions = (fiche.questions as any[]) || [];
// //   const responses = (fiche.responses as any[]) || [];

// //   // Garder uniquement réponses appartenant à la conversation
// //   const responsesForConv = responses.filter(r => r.conversationId === conversationId);

// //   // Pour chaque question de la fiche, retrouver les réponses qui contiennent cette question
// //   const questionsWithResponses = questions.map(q => {
// //     const matched = responsesForConv
// //       .filter((r: any) => Array.isArray(r.items) && r.items.some((it: any) => it.questionId === q.id))
// //       .map((r: any) => {
// //         const item = (r.items || []).find((it: any) => it.questionId === q.id);
// //         return {
// //           responseId: r.id,
// //           submittedAt: r.submittedAt ?? null,
// //           senderId: r.senderId ?? null,
// //           submittedForUserId: r.submittedForUserId ?? null,
// //           valueText: item?.valueText ?? null,
// //           optionValue: item?.optionValue ?? null,
// //         };
// //       });

// //     return {
// //       question: q,
// //       responses: matched,
// //     };
// //   });

// //   return {
// //     ficheId: fiche.ficheId,
// //     ficheTitle: fiche.title,
// //     questions: questionsWithResponses,
// //   };
// // }
// //   async generateConversationSummary(conversationId: number) {
// //     const fiches = await this.prisma.fiche.findMany();
// //     const entries: Array<{ fiche: any; responses: any[] }> = [];

// //     for (const fiche of fiches) {
// //       const responses = (fiche.responses as any[]) || [];
// //       const forConv = responses.filter(r => r.conversationId === conversationId);
// //       if (forConv.length) entries.push({ fiche, responses: forConv });
// //     }

// //     if (!entries.length) {
// //       return { conversationId, summary: 'Aucune réponse enregistrée pour cette conversation.' };
// //     }

// //     const summary = this.composeGlobalSummaryFromEntries(entries);
// //     return { conversationId, summary };
// //   }

// //   // =====================================
// //   // 🔧 Fonctions internes
// //   // =====================================

// //   private composeGlobalSummaryFromEntries(entries: Array<{ fiche: any; responses: any[] }>): string {
// //     if (!entries.length) return '';

// //     const perFicheLatest = entries.map(({ fiche, responses }) => {
// //       const rs = [...responses].sort(
// //         (a, b) => new Date(a.submittedAt || 0).getTime() - new Date(b.submittedAt || 0).getTime(),
// //       );
// //       return { fiche, response: rs[rs.length - 1] };
// //     });

// //     const main = this.renderOneResponseSummary(perFicheLatest[0].fiche, perFicheLatest[0].response);

// //     if (perFicheLatest.length === 1) return main;

// //     const secondaryTexts: string[] = [];
// //     const allSignes: string[] = [];

// //     for (const { fiche, response } of perFicheLatest.slice(1)) {
// //       const items = response.items || [];
// //       const slots = this.buildSlotIndexFromOrders(fiche);

// //       const siege = this.findItemByQuestionId(items, slots.siege)?.valueText;
// //       const duree = this.mapDuree(this.findItemByQuestionId(items, slots.duree)?.optionValue);
// //       const type = this.mapType(this.findItemByQuestionId(items, slots.type)?.optionValue);
// //       const signes = this.findItemByQuestionId(items, slots.signes)?.optionValue;

// //       if (signes && signes !== 'aucun') allSignes.push(signes);

// //       const symptome =
// //         this.findItemByQuestionId(items, slots.symptome)?.valueText ||
// //         fiche.title?.split('–')[0]?.trim() ||
// //         'un symptôme';

// //       const segParts = [
// //         duree ? `depuis ${duree.replace(/^depuis\s+/, '')}` : undefined,
// //         siege ? `localisée ${siege}` : undefined,
// //         type ? `de nature ${type.replace(/^comme\s+/, '')}` : undefined,
// //         signes && signes !== 'aucun' ? `avec ${signes}` : undefined,
// //       ].filter(Boolean);

// //       secondaryTexts.push(`${symptome.toLowerCase()} ${segParts.join(', ')}`.trim());
// //     }

// //     let out = main;
// //     if (secondaryTexts.length) {
// //       out += ` Le patient rapporte également ${secondaryTexts.join('; ')}.`;
// //     }

// //     const uniqSignes = Array.from(new Set(allSignes));
// //     if (uniqSignes.length > 1) {
// //       out += ` L’ensemble est accompagné de ${uniqSignes.join(' et ')}.`;
// //     }

// //     return out.trim();
// //   }

// //   private renderOneResponseSummary(fiche: any, response: any): string {
// //     const items = response.items || [];
// //     const slots = this.buildSlotIndexFromOrders(fiche);

// //     const getText = (qid?: string) => this.findItemByQuestionId(items, qid)?.valueText;
// //     const getSelect = (qid?: string) => this.findItemByQuestionId(items, qid)?.optionValue;

// //     const symptome = getText(slots.symptome) || fiche.title?.split('–')[0]?.trim() || 'un symptôme';
// //     const mode = this.mapMode(getSelect(slots.mode));
// //     const duree = this.mapDuree(getSelect(slots.duree));
// //     const intensite = this.mapIntensite(getSelect(slots.intensite));
// //     const siege = getText(slots.siege);
// //     const type = this.mapType(getSelect(slots.type));
// //     const irradiation = this.mapIrradiation(getSelect(slots.irradiation));
// //     const rythme = this.mapRythme(getSelect(slots.rythme));
// //     const aggravant = getText(slots.aggravants);
// //     const calmant = getText(slots.calmants);
// //     const signes = getSelect(slots.signes);

// //     const parts: string[] = [];
// //     if (mode) parts.push(mode);
// //     if (duree) parts.push(duree);
// //     if (intensite) parts.push(intensite);
// //     if (siege) parts.push(`localisée à ${siege}`);
// //     if (type) parts.push(`ressentie ${type}`);
// //     if (irradiation) parts.push(irradiation);
// //     if (rythme) parts.push(`(${rythme})`);
// //     if (aggravant) parts.push(`aggravée par ${aggravant}`);
// //     if (calmant) parts.push(`calmée par ${calmant}`);
// //     if (signes && signes !== 'aucun') parts.push(`associée à ${signes}`);

// //     return `Le patient présente ${symptome.toLowerCase()} ${parts.join(', ')}.`.trim();
// //   }

// //   // ========== helpers techniques ==========

// //   private findItemByQuestionId(items: any[], qid?: string) {
// //     if (!qid) return undefined;
// //     return items.find(i => i.questionId === qid);
// //   }

// //   private buildSlotIndexFromOrders(fiche: any) {
// //     const out: any = {};
// //     for (const q of fiche.questions || []) {
// //       switch (q.order) {
// //         case 0:
// //           out.symptome = q.id;
// //           break;
// //         case 1:
// //           out.mode = q.id;
// //           break;
// //         case 2:
// //           out.duree = q.id;
// //           break;
// //         case 3:
// //           out.intensite = q.id;
// //           break;
// //         case 4:
// //           out.siege = q.id;
// //           break;
// //         case 5:
// //           out.type = q.id;
// //           break;
// //         case 6:
// //           out.irradiation = q.id;
// //           break;
// //         case 7:
// //           out.rythme = q.id;
// //           break;
// //         case 8:
// //           out.aggravants = q.id;
// //           break;
// //         case 9:
// //           out.calmants = q.id;
// //           break;
// //         case 10:
// //           out.signes = q.id;
// //           break;
// //       }
// //     }
// //     return out;
// //   }

// //   // ========== mapping valeurs brutes → texte clair ==========

// //   private mapMode(v?: string) {
// //     return (
// //       {
// //         dun_coup: 'apparue brutalement',
// //         petit_a_petit: 'apparue progressivement',
// //         depuis_longtemps: 'évoluant depuis longtemps',
// //       }[v || ''] || undefined
// //     );
// //   }

// //   private mapDuree(v?: string) {
// //     return (
// //       {
// //         minutes: 'depuis quelques minutes',
// //         heures: 'depuis quelques heures',
// //         jours: 'depuis quelques jours',
// //         semaines: 'depuis quelques semaines',
// //         mois: 'depuis quelques mois',
// //       }[v || ''] || undefined
// //     );
// //   }

// //   private mapIntensite(v?: string) {
// //     return (
// //       {
// //         leger: 'd’intensité légère (1–3/10)',
// //         moyen: 'd’intensité modérée (4–6/10)',
// //         fort: 'd’intensité forte (7–10/10)',
// //       }[v || ''] || undefined
// //     );
// //   }

// //   private mapType(v?: string) {
// //     return (
// //       {
// //         brulure: 'comme une brûlure',
// //         serrement: 'comme un serrement',
// //         poignard: 'comme un coup de poignard',
// //         lourdeur: 'comme une lourdeur',
// //         autre: 'd’une autre nature',
// //       }[v || ''] || undefined
// //     );
// //   }

// //   private mapIrradiation(v?: string) {
// //     return (
// //       {
// //         oui: 'avec irradiation',
// //         non: 'sans irradiation',
// //       }[v || ''] || undefined
// //     );
// //   }

// //   private mapRythme(v?: string) {
// //     return (
// //       {
// //         journee: 'surtout la journée',
// //         nuit: 'surtout la nuit',
// //         bouge: 'lors des mouvements',
// //         repos: 'au repos',
// //         apres_repas: 'après les repas',
// //         fatigue: 'en cas de fatigue',
// //       }[v || ''] || undefined
// //     );
// //   }



// // async generateConversationSummaryMistidracs(conversationId: number) {
// // const fiche = await this.prisma.fiche.findFirst({
// //   where: {
// //     requests: {
// //       some: {
// //         conversationId,
// //       },
// //     },
// //   },
// //   select: {
// //     ficheId: true,
// //     responses: true,
// //   },
// // });

// // if (!fiche || !Array.isArray(fiche.responses)) {
// //   throw new NotFoundException('Aucune réponse de fiche trouvée');
// // }

// // const payload = fiche.responses;

// //   return this.openai.generateMistidracsSummary(
// //     conversationId,
// //     payload,
// //   );
// // }

// // async generateConversationMistidracsGemini(conversationId: number) {
// //   const fiche = await this.prisma.fiche.findFirst({
// //     where: {
// //       requests: {
// //         some: { conversationId },
// //       },
// //     },
// //     select: { responses: true },
// //   });

// //   if (!fiche || !Array.isArray(fiche.responses)) {
// //     throw new NotFoundException('Aucune réponse trouvée');
// //   }

// //   return this.gemini.generateMistidracsSummary(
// //     conversationId,
// //     fiche.responses,
// //   );
// // }



// // // src/messageries/messageries.service.ts

// // async explainFicheQuestion(
// //   ficheId: number,
// //   questionId: string, // ✅ UUID
// //   provider: 'openai' | 'gemini' = 'openai',
// // ) {
// //   const fiche = await this.prisma.fiche.findUnique({
// //     where: { ficheId },
// //     select: {
// //       ficheId: true,
// //       questions: true,
// //     },
// //   });

// //   if (!fiche) {
// //     throw new NotFoundException('Fiche introuvable');
// //   }

// //   const questions = fiche.questions as FicheQuestion[];

// //   const question = questions.find(
// //     (q) => q.id === questionId,
// //   );

// //   if (!question) {
// //     throw new NotFoundException(
// //       'Question introuvable dans cette fiche',
// //     );
// //   }

// //   const prompt = buildExplainQuestionPrompt({
// //     ficheId,
// //     questionId,
// //     label: question.label,
// //     description: question.description,
// //   });

// //   if (provider === 'gemini') {
// //     return this.gemini.generateJson(prompt);
// //   }

// //   return this.openai.generateJson(prompt);
// // }




// // }


// import {
//   BadRequestException, ForbiddenException, Injectable, NotFoundException,
// } from '@nestjs/common';
// import { PrismaService } from 'src/prisma/prisma.service';
// import { SendDmMessageDto } from './dto/send-dm-message.dto';
// import { QueryConversationsDto } from './dto/query-conversations.dto';
// import { QueryMessagesDto } from 'src/common/dto/query-messages.dto';
// import { SendFicheRequestDto } from './dto/send-fiche-request.dto';
// import { SubmitFicheResponseDto } from './dto/submit-fiche-response.dto';
// import { QueryConversationDetailDto } from './dto/query-conversation-detail.dto';
// import { randomUUID } from 'crypto';
// import { bi, isValidExpoToken, sendExpoPush } from 'src/utils/expo-push';
// import { QuerySummaryAiDto } from './dto/query-summary-ai.dto';
// import { GeminiService } from 'src/ai/gemini/gemini.service';
// import { OpenaiService } from 'src/ai/ai.service';
// import { AiProvider } from './dto/explain-question.dto';
// import { buildExplainQuestionPrompt } from 'src/ai/explain-question.prompt';
// import { FicheQuestion } from 'src/fiches/types/fiche-question.type';

// @Injectable()
// export class MessageriesService {
//   constructor(
//     private readonly prisma: PrismaService,
//     private readonly openai: OpenaiService,
//     private readonly gemini: GeminiService
//   ) {}

//   private async getOrCreateConversation(medecinId: number, patientId: number) {
//     const [med, pat] = await Promise.all([
//       this.prisma.user.findUnique({ where: { userId: medecinId } }),
//       this.prisma.user.findUnique({ where: { userId: patientId } }),
//     ]);
//     if (!med || med.userType !== 'MEDECIN') throw new NotFoundException({ message: `Médecin ${medecinId} introuvable.` });
//     if (!pat || pat.userType !== 'PATIENT') throw new NotFoundException({ message: `Patient ${patientId} introuvable.` });

//     const existing = await this.prisma.conversation.findUnique({
//       where: { medecinId_patientId: { medecinId, patientId } },
//     });
//     if (existing) return existing;
//     return this.prisma.conversation.create({ data: { medecinId, patientId, lastMessageAt: new Date() } });
//   }

//   private async createNotification(userId: number, titleFr: string, titleEn: string, msgFr: string, msgEn: string) {
//     return this.prisma.notification.create({
//       data: { userId, title: bi(titleFr, titleEn), message: bi(msgFr, msgEn), isRead: false },
//     });
//   }

//   // =====================================================
//   // ✅ RÈGLE: Patient -> Médecin autorisé uniquement
//   //    entre (datetime réservation) et (datetime réservation + 24h)
//   // =====================================================
//   private pad2(n: number) {
//     return String(n).padStart(2, '0');
//   }

//   private toLocalYmd(d: Date) {
//     return `${d.getFullYear()}-${this.pad2(d.getMonth() + 1)}-${this.pad2(d.getDate())}`;
//   }

//   private toLocalHm(d: Date) {
//     return `${this.pad2(d.getHours())}:${this.pad2(d.getMinutes())}`;
//   }

//   private normalizeHour(hourRaw: any): string {
//     const raw = String(hourRaw ?? '').trim();

//     // formats possibles : "11:00", "11:00:00", "11h00"
//     const hStyle = raw.match(/^(\d{1,2})h(\d{2})$/i);
//     if (hStyle) {
//       const hh = this.pad2(Number(hStyle[1]));
//       const mm = this.pad2(Number(hStyle[2]));
//       return `${hh}:${mm}`;
//     }

//     const colonStyle = raw.match(/^(\d{1,2}):(\d{2})/);
//     if (colonStyle) {
//       const hh = this.pad2(Number(colonStyle[1]));
//       const mm = this.pad2(Number(colonStyle[2]));
//       return `${hh}:${mm}`;
//     }

//     throw new BadRequestException({
//       message: `Format d'heure invalide dans la réservation: "${raw}"`,
//       messageE: `Invalid reservation hour format: "${raw}"`,
//     });
//   }

//   private parseReservationDateTime(dateStr: any, hourStr: any): Date {
//     const d = String(dateStr ?? '').trim();
//     const hm = this.normalizeHour(hourStr);

//     // Date attendue : YYYY-MM-DD
//     if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) {
//       throw new BadRequestException({
//         message: `Format de date invalide dans la réservation: "${d}"`,
//         messageE: `Invalid reservation date format: "${d}"`,
//       });
//     }

//     const dt = new Date(`${d}T${hm}:00`);
//     if (isNaN(dt.getTime())) {
//       throw new BadRequestException({
//         message: `Date/heure de réservation invalide: "${d} ${hm}"`,
//         messageE: `Invalid reservation datetime: "${d} ${hm}"`,
//       });
//     }
//     return dt;
//   }

//   private formatYmdHm(d: Date) {
//     return `${d.getFullYear()}-${this.pad2(d.getMonth() + 1)}-${this.pad2(d.getDate())} ${this.pad2(d.getHours())}:${this.pad2(d.getMinutes())}`;
//   }

//   private async assertPatientMessagingWindow(medecinId: number, patientId: number) {
//     const now = new Date();
//     const todayStr = this.toLocalYmd(now);
//     const timeStr = this.toLocalHm(now);

//     // Dernière réservation déjà commencée (<= maintenant)
//     const latestPast = await this.prisma.reservation.findFirst({
//       where: {
//         medecinId,
//         patientId,
//         OR: [
//           { date: { lt: todayStr } },
//           { AND: [{ date: todayStr }, { hour: { lte: timeStr } }] },
//         ],
//       },
//       orderBy: [{ date: 'desc' }, { hour: 'desc' }],
//       select: { reservationId: true, date: true, hour: true },
//     });

//     if (!latestPast) {
//       throw new ForbiddenException({
//         message:
//           "Messagerie bloquée : vous ne pouvez contacter ce médecin qu'à partir de l'heure de votre réservation (et pendant 24h). Aucune réservation passée n'a été trouvée.",
//         messageE:
//           'Messaging blocked: you can contact this doctor only from your reservation time (and for 24h). No past reservation found.',
//       });
//     }

//     const start = this.parseReservationDateTime(latestPast.date, latestPast.hour);
//     const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);

//     // Autorisé: start <= now <= end
//     if (now.getTime() < start.getTime()) {
//       throw new ForbiddenException({
//         message:
//           `Messagerie bloquée : vous pourrez contacter le médecin à partir de ${String(latestPast.date).trim()} ${this.normalizeHour(latestPast.hour)} (pendant 24h).`,
//         messageE:
//           `Messaging blocked: you can contact the doctor starting ${String(latestPast.date).trim()} ${this.normalizeHour(latestPast.hour)} (for 24h).`,
//       });
//     }

//     if (now.getTime() > end.getTime()) {
//       throw new ForbiddenException({
//         message:
//           `Messagerie bloquée : la fenêtre de 24h après votre réservation est terminée (fin : ${this.formatYmdHm(end)}).`,
//         messageE:
//           `Messaging blocked: the 24h window after your reservation is over (ends: ${this.formatYmdHm(end)}).`,
//       });
//     }
//   }

//   /* ------------------ DM basiques ------------------ */
//   async sendDmMessage(senderId: number, dto: SendDmMessageDto) {
//     if (senderId !== dto.medecinId && senderId !== dto.patientId) {
//       throw new ForbiddenException({ message: `Vous ne faites pas partie de cette conversation.` });
//     }
//     const hasText = !!dto.content && dto.content.trim().length > 0;
//     const hasMeta = dto.meta && Object.keys(dto.meta).length > 0;
//     if (!hasText && !hasMeta) {
//       throw new BadRequestException({ message: `Fournissez un message texte ou des métadonnées.` });
//     }

//     const conv = await this.getOrCreateConversation(dto.medecinId, dto.patientId);
//     const receiverId = senderId === dto.medecinId ? dto.patientId : dto.medecinId;

//     // ✅ NOUVEAU : si patient -> médecin, vérifier fenêtre 24h après réservation
//     if (senderId === conv.patientId && receiverId === conv.medecinId) {
//       await this.assertPatientMessagingWindow(conv.medecinId, conv.patientId);
//     }

//     const created = await this.prisma.$transaction(async (tx) => {
//       const msg = await tx.message.create({
//         data: {
//           kind: hasMeta && !hasText ? 'SYSTEM' : 'TEXT',
//           conversationId: conv.conversationId,
//           senderId,
//           receiverId,
//           content: hasText ? dto.content!.trim() : undefined,
//           meta: hasMeta ? (dto.meta as any) : undefined,
//           isRead: false,
//         },
//       });
//       await tx.conversation.update({
//         where: { conversationId: conv.conversationId },
//         data: { lastMessageAt: new Date() },
//       });
//       return msg;
//     });

//     // 🔔 Push & Notification au destinataire
//     const [sender, receiver] = await Promise.all([
//       this.prisma.user.findUnique({ where: { userId: senderId } }),
//       this.prisma.user.findUnique({ where: { userId: receiverId } }),
//     ]);

//     const titleFr = 'Nouveau message';
//     const titleEn = 'New message';
//     const bodyFr = hasText ? dto.content!.trim() : 'Vous avez reçu un message.';
//     const bodyEn = hasText ? dto.content!.trim() : 'You received a message.';

//     // save Notification (destinataire)
//     if (receiver) {
//       void this.createNotification(
//         receiver.userId,
//         titleFr, titleEn,
//         `De ${sender?.firstName ?? ''} ${sender?.lastName ?? ''} — ${bodyFr}`,
//         `From ${sender?.firstName ?? ''} ${sender?.lastName ?? ''} — ${bodyEn}`,
//       ).catch(() => void 0);

//       // push Expo au destinataire si token valide
//       const token = receiver.expotoken;
//       if (isValidExpoToken(token)) {
//         void sendExpoPush({
//           to: token!,
//           sound: 'default',
//           title: bi(titleFr, titleEn),
//           body: bi(
//             `De ${sender?.firstName ?? ''} ${sender?.lastName ?? ''}: ${bodyFr}`,
//             `From ${sender?.firstName ?? ''} ${sender?.lastName ?? ''}: ${bodyEn}`
//           ),
//           data: { kind: 'DM', conversationId: conv.conversationId, messageId: created.messageId },
//           priority: 'high',
//         });
//       }
//     }

//     return { message: 'Message envoyé', item: created };
//   }

//   async listConversations(query: QueryConversationsDto) {
//     const page  = Number(query.page ?? 1);
//     const limit = Number(query.limit ?? 10);
//     if (page < 1 || limit < 1) {
//       throw new BadRequestException({ message: 'Page et limit >= 1.' });
//     }
//     const skip = (page - 1) * limit;

//     const where: any = {};
//     if (query.medecinId) where.medecinId = query.medecinId;
//     if (query.patientId) where.patientId = query.patientId;
//     if (query.unreadOnly && query.forUserId) {
//       where.messages = { some: { receiverId: query.forUserId, isRead: false } };
//     }

//     const [rows, total] = await this.prisma.$transaction([
//       this.prisma.conversation.findMany({
//         where,
//         skip,
//         take: limit,
//         orderBy: { lastMessageAt: 'desc' },
//         include: {
//           medecin: {
//             select: {
//               userId: true,
//               firstName: true,
//               lastName: true,
//               profile: true,
//               phone: true,
//             },
//           },
//           patient: {
//             select: {
//               userId: true,
//               firstName: true,
//               lastName: true,
//               profile: true,
//               phone: true,
//             },
//           },
//           messages: { orderBy: { createdAt: 'desc' }, take: 1 },
//         },
//       }),
//       this.prisma.conversation.count({ where }),
//     ]);

//     // ====== Unread map (inchangé) ======
//     let unreadMap: Record<number, number> = {};
//     if (query.forUserId && rows.length) {
//       const grouped = await this.prisma.message.groupBy({
//         by: ['conversationId'],
//         where: {
//           conversationId: { in: rows.map(r => r.conversationId) },
//           receiverId: query.forUserId,
//           isRead: false,
//         },
//         _count: { _all: true },
//       });
//       unreadMap = Object.fromEntries(
//         grouped.map(g => [g.conversationId!, g._count._all]),
//       );
//     }

//     // ====== Map de la dernière réservation passée la plus proche ======
//     let reservationMap: Record<number, number | null> = {};

//     if (rows.length) {
//       const now = new Date();
//       const todayStr = this.toLocalYmd(now); // 'YYYY-MM-DD' local
//       const timeStr  = this.toLocalHm(now);  // 'HH:MM' local

//       // Toutes les réservations DÉJÀ PASSÉES pour les couples (medecinId, patientId)
//       const pastReservations = await this.prisma.reservation.findMany({
//         where: {
//           AND: [
//             {
//               OR: rows.map(r => ({
//                 medecinId: r.medecinId,
//                 patientId: r.patientId,
//               })),
//             },
//             {
//               OR: [
//                 { date: { lt: todayStr } },
//                 { AND: [{ date: todayStr }, { hour: { lte: timeStr } }] },
//               ],
//             },
//           ],
//         },
//         orderBy: [
//           { date: 'desc' },
//           { hour: 'desc' },
//         ],
//         select: {
//           reservationId: true,
//           medecinId: true,
//           patientId: true,
//           date: true,
//           hour: true,
//         },
//       });

//       for (const conv of rows) {
//         const match = pastReservations.find(
//           r =>
//             r.medecinId === conv.medecinId &&
//             r.patientId === conv.patientId,
//         );
//         reservationMap[conv.conversationId] = match?.reservationId ?? null;
//       }
//     }

//     const items = rows.map(r => ({
//       conversationId: r.conversationId,
//       medecin: r.medecin,
//       patient: r.patient,
//       lastMessageAt: r.lastMessageAt,
//       lastMessage: r.messages[0] ?? null,
//       unreadCountForUser: query.forUserId
//         ? (unreadMap[r.conversationId] ?? 0)
//         : 0,
//       lastReservationId: reservationMap[r.conversationId] ?? null,
//     }));

//     return {
//       message: 'Conversations récupérées.',
//       items,
//       meta: {
//         total,
//         page,
//         limit,
//         lastPage: Math.ceil(total / limit),
//       },
//     };
//   }

//   async listMessages(conversationId: number, query: QueryMessagesDto) {
//     const page  = Number(query.page ?? 1);
//     const limit = Number(query.limit ?? 20);
//     if (page < 1 || limit < 1) throw new BadRequestException({ message: 'Page et limit >= 1.' });
//     const conv = await this.prisma.conversation.findUnique({ where: { conversationId } });
//     if (!conv) throw new NotFoundException({ message: `Conversation ${conversationId} introuvable.` });
//     if (query.forUserId && query.forUserId !== conv.medecinId && query.forUserId !== conv.patientId) {
//       throw new ForbiddenException({ message: `Vous n'êtes pas participant de cette conversation.` });
//     }

//     const skip = (page - 1) * limit;

//     const [items, total] = await this.prisma.$transaction([
//       this.prisma.message.findMany({
//         where: { conversationId },
//         skip, take: limit,
//         orderBy: { createdAt: 'desc' },
//         select: {
//           messageId: true, senderId: true, receiverId: true, kind: true,
//           content: true, meta: true, isRead: true, createdAt: true, ficheId: true,
//           sender: { select: { userId: true, firstName: true, lastName: true, profile: true } },
//           receiver: { select: { userId: true, firstName: true, lastName: true, profile: true } },
//         },
//       }),
//       this.prisma.message.count({ where: { conversationId } }),
//     ]);

//     return { message: 'Messages récupérés.', items,
//       meta: { total, page, limit, lastPage: Math.ceil(total / limit) } };
//   }

//   async markConversationRead(conversationId: number, readerId: number) {
//     const conv = await this.prisma.conversation.findUnique({ where: { conversationId } });
//     if (!conv) throw new NotFoundException({ message: `Conversation ${conversationId} introuvable.` });
//     if (readerId !== conv.medecinId && readerId !== conv.patientId) {
//       throw new ForbiddenException({ message: `Vous n'êtes pas participant de cette conversation.` });
//     }
//     const res = await this.prisma.message.updateMany({
//       where: { conversationId, receiverId: readerId, isRead: false },
//       data: { isRead: true },
//     });
//     return { message: `Conversation marquée comme lue (${res.count} message(s)).`, updated: res.count };
//   }

//   async getConversationAndMarkRead(conversationId: number, query: QueryConversationDetailDto) {
//     const readerId = Number(query.readerId);
//     if (!readerId || isNaN(readerId)) {
//       throw new BadRequestException({ message: 'readerId est requis et doit être un entier.' });
//     }

//     const conv = await this.prisma.conversation.findUnique({
//       where: { conversationId },
//       include: {
//         medecin: { select: { userId: true, firstName: true, lastName: true } },
//         patient: { select: { userId: true, firstName: true, lastName: true } },
//       },
//     });
//     if (!conv) throw new NotFoundException({ message: `Conversation ${conversationId} introuvable.` });

//     await this.prisma.message.updateMany({
//       where: { conversationId, isRead: false, NOT: { senderId: readerId } },
//       data: { isRead: true },
//     });

//     const page = query.page ?? 1;
//     const limit = query.limit ?? 20;
//     if (page < 1 || limit < 1) throw new BadRequestException({ message: 'Page et limit >= 1.' });
//     const skip = (page - 1) * limit;

//     const [messages, total, unreadCount] = await this.prisma.$transaction([
//       this.prisma.message.findMany({
//         where: { conversationId },
//         orderBy: { createdAt: 'desc' },
//         skip, take: limit,
//         select: {
//           messageId: true, senderId: true, receiverId: true, kind: true,
//           content: true, meta: true, isRead: true, createdAt: true, ficheId: true,
//         },
//       }),
//       this.prisma.message.count({ where: { conversationId } }),
//       this.prisma.message.count({
//         where: { conversationId, isRead: false, NOT: { senderId: readerId } },
//       }),
//     ]);

//     return {
//       message: 'Conversation récupérée et marquée comme lue.',
//       conversation: conv,
//       items: messages,
//       meta: { total, page, limit, lastPage: Math.ceil(total / limit), unreadForReader: unreadCount },
//     };
//   }

//   async getUnreadOverview(forUserId: number) {
//     const u = await this.prisma.user.findUnique({ where: { userId: forUserId } });
//     if (!u) throw new NotFoundException({ message: `User ${forUserId} introuvable` });

//     const dmCounts = await this.prisma.message.groupBy({
//       by: ['conversationId'],
//       where: { receiverId: forUserId, isRead: false, conversationId: { not: null } },
//       _count: { _all: true },
//     });
//     const dmMap = Object.fromEntries(
//       dmCounts.filter(x => x.conversationId !== null).map(x => [x.conversationId!, x._count._all])
//     );

//     return { forUserId, dm: dmMap, totals: { dmTotal: Object.values(dmMap).reduce((a,b)=>a+b,0) } };
//   }

//   /* ------------------ FICHES : DEMANDE / RÉPONSE ------------------ */
//   async sendFicheRequest(dto: SendFicheRequestDto) {
//     const [fiche, conv] = await Promise.all([
//       this.prisma.fiche.findUnique({ where: { ficheId: dto.ficheId } }),
//       this.prisma.conversation.findUnique({ where: { conversationId: dto.conversationId } }),
//     ]);
//     if (!fiche) throw new NotFoundException({ message: 'Fiche introuvable' });
//     if (!conv) throw new NotFoundException({ message: 'Conversation introuvable' });

//     if (dto.senderId !== conv.medecinId) {
//       throw new ForbiddenException({ message: 'Seul le médecin de la conversation peut envoyer la fiche.' });
//     }

//     const msg = await this.prisma.$transaction(async (tx) => {
//       const created = await tx.message.create({
//         data: {
//           kind: 'FICHE_REQUEST',
//           conversationId: conv.conversationId,
//           senderId: dto.senderId,
//           receiverId: conv.patientId,
//           ficheId: fiche.ficheId,
//           isRead: false,
//         },
//       });
//       await tx.conversation.update({
//         where: { conversationId: conv.conversationId },
//         data: { lastMessageAt: new Date() },
//       });
//       return created;
//     });

//     return { message: 'Fiche demandée', item: msg };
//   }

//   async submitFicheResponse(dto: SubmitFicheResponseDto) {
//     const [fiche, conv] = await Promise.all([
//       this.prisma.fiche.findUnique({ where: { ficheId: dto.ficheId } }),
//       this.prisma.conversation.findUnique({ where: { conversationId: dto.conversationId } }),
//     ]);
//     if (!fiche) throw new NotFoundException('Fiche introuvable');
//     if (!conv) throw new NotFoundException('Conversation introuvable');

//     if (dto.senderId !== conv.medecinId && dto.senderId !== conv.patientId) {
//       throw new ForbiddenException(`Vous n'êtes pas participant de cette conversation.`);
//     }

//     // ✅ NOUVEAU : si patient répond (donc envoie au médecin via DM), vérifier fenêtre 24h
//     if (dto.senderId === conv.patientId) {
//       await this.assertPatientMessagingWindow(conv.medecinId, conv.patientId);
//     }

//     const questions = (fiche.questions as any[]) || [];
//     const qMap = new Map(questions.map(q => [q.id, q]));
//     const items: any[] = [];

//     for (const a of dto.answers) {
//       const q = qMap.get(a.questionId);
//       if (!q) throw new BadRequestException(`questionId ${a.questionId} invalide`);

//       if (q.type === 'TEXT') {
//         if (!a.valueText || !a.valueText.trim()) {
//           throw new BadRequestException(`valueText requis pour TEXT (question ${a.questionId})`);
//         }
//         if (a.optionValue) throw new BadRequestException(`optionValue interdit pour TEXT (question ${a.questionId})`);
//         items.push({ questionId: a.questionId, valueText: a.valueText.trim() });
//       } else {
//         if (!a.optionValue) {
//           throw new BadRequestException(`optionValue requis pour SELECT (question ${a.questionId})`);
//         }
//         if (!q.options?.some((o:any) => o.value === a.optionValue)) {
//           throw new BadRequestException(`optionValue "${a.optionValue}" inconnu pour question ${a.questionId}`);
//         }
//         if (a.valueText) throw new BadRequestException(`valueText interdit pour SELECT (question ${a.questionId})`);
//         items.push({ questionId: a.questionId, optionValue: a.optionValue });
//       }
//     }

//     const response = {
//       id: randomUUID(),
//       conversationId: dto.conversationId,
//       senderId: dto.senderId,
//       submittedForUserId: dto.submittedForUserId ?? null,
//       submittedAt: new Date().toISOString(),
//       items,
//     };

//     const nextResponses = ([...(fiche.responses as any[] || []), response]);

//     await this.prisma.fiche.update({
//       where: { ficheId: fiche.ficheId },
//       data: { responses: nextResponses },
//     });

//     const receiverId = dto.senderId === conv.medecinId ? conv.patientId : conv.medecinId;
//     await this.prisma.message.create({
//       data: {
//         kind: 'FICHE_RESPONSE',
//         conversationId: conv.conversationId,
//         senderId: dto.senderId,
//         receiverId,
//         meta: { responseId: response.id, ficheId: fiche.ficheId, requestMessageId: dto.requestMessageId ?? null },
//         isRead: false,
//       } as any,
//     });

//     this.prisma.conversation.update({
//       where: { conversationId: conv.conversationId },
//       data: { lastMessageAt: new Date() },
//     }).catch(() => void 0);

//     return { response };
//   }

//   // ------------------
//   // 1) listFicheResponsesByConversation (mise à jour)
//   // ------------------
//   async listFicheResponsesByConversation(conversationId: number) {
//     if (!conversationId || isNaN(conversationId)) {
//       throw new BadRequestException('conversationId requis et doit être un entier');
//     }

//     const fiches = await this.prisma.fiche.findMany();
//     const out: any[] = [];

//     for (const f of fiches) {
//       const questions = (f.questions as any[]) || [];
//       const responses = (f.responses as any[]) || [];

//       const forConv = responses
//         .filter(r => r.conversationId === conversationId)
//         .map(r => {
//           const enrichedItems = (r.items || []).map((it: any) => {
//             const q = questions.find(qx => qx.id === it.questionId) || null;
//             return {
//               questionId: it.questionId,
//               optionValue: it.optionValue ?? null,
//               valueText: it.valueText ?? null,
//               question: q,
//             };
//           });

//           return {
//             ficheId: f.ficheId,
//             ficheTitle: f.title,
//             responseId: r.id,
//             conversationId: r.conversationId,
//             senderId: r.senderId,
//             submittedForUserId: r.submittedForUserId ?? null,
//             submittedAt: r.submittedAt ?? null,
//             items: enrichedItems,
//           };
//         });

//       out.push(...forConv);
//     }

//     out.sort((a, b) => {
//       const ta = a.submittedAt ? String(a.submittedAt) : '';
//       const tb = b.submittedAt ? String(b.submittedAt) : '';
//       return tb.localeCompare(ta);
//     });

//     return { items: out };
//   }

//   // ------------------
//   // 2) getFicheQuestionsAndResponses (nouveau)
//   // ------------------
//   async getFicheQuestionsAndResponses(conversationId: number, ficheId: number) {
//     if (!conversationId || isNaN(conversationId) || !ficheId || isNaN(ficheId)) {
//       throw new BadRequestException('conversationId et ficheId requis et doivent être des entiers');
//     }

//     const fiche = await this.prisma.fiche.findUnique({ where: { ficheId } });
//     if (!fiche) {
//       throw new NotFoundException(`Fiche ${ficheId} introuvable`);
//     }

//     const questions = (fiche.questions as any[]) || [];
//     const responses = (fiche.responses as any[]) || [];

//     const responsesForConv = responses.filter(r => r.conversationId === conversationId);

//     const questionsWithResponses = questions.map(q => {
//       const matched = responsesForConv
//         .filter((r: any) => Array.isArray(r.items) && r.items.some((it: any) => it.questionId === q.id))
//         .map((r: any) => {
//           const item = (r.items || []).find((it: any) => it.questionId === q.id);
//           return {
//             responseId: r.id,
//             submittedAt: r.submittedAt ?? null,
//             senderId: r.senderId ?? null,
//             submittedForUserId: r.submittedForUserId ?? null,
//             valueText: item?.valueText ?? null,
//             optionValue: item?.optionValue ?? null,
//           };
//         });

//       return {
//         question: q,
//         responses: matched,
//       };
//     });

//     return {
//       ficheId: fiche.ficheId,
//       ficheTitle: fiche.title,
//       questions: questionsWithResponses,
//     };
//   }

//   async generateConversationSummary(conversationId: number) {
//     const fiches = await this.prisma.fiche.findMany();
//     const entries: Array<{ fiche: any; responses: any[] }> = [];

//     for (const fiche of fiches) {
//       const responses = (fiche.responses as any[]) || [];
//       const forConv = responses.filter(r => r.conversationId === conversationId);
//       if (forConv.length) entries.push({ fiche, responses: forConv });
//     }

//     if (!entries.length) {
//       return { conversationId, summary: 'Aucune réponse enregistrée pour cette conversation.' };
//     }

//     const summary = this.composeGlobalSummaryFromEntries(entries);
//     return { conversationId, summary };
//   }

//   private composeGlobalSummaryFromEntries(entries: Array<{ fiche: any; responses: any[] }>): string {
//     if (!entries.length) return '';

//     const perFicheLatest = entries.map(({ fiche, responses }) => {
//       const rs = [...responses].sort(
//         (a, b) => new Date(a.submittedAt || 0).getTime() - new Date(b.submittedAt || 0).getTime(),
//       );
//       return { fiche, response: rs[rs.length - 1] };
//     });

//     const main = this.renderOneResponseSummary(perFicheLatest[0].fiche, perFicheLatest[0].response);

//     if (perFicheLatest.length === 1) return main;

//     const secondaryTexts: string[] = [];
//     const allSignes: string[] = [];

//     for (const { fiche, response } of perFicheLatest.slice(1)) {
//       const items = response.items || [];
//       const slots = this.buildSlotIndexFromOrders(fiche);

//       const siege = this.findItemByQuestionId(items, slots.siege)?.valueText;
//       const duree = this.mapDuree(this.findItemByQuestionId(items, slots.duree)?.optionValue);
//       const type = this.mapType(this.findItemByQuestionId(items, slots.type)?.optionValue);
//       const signes = this.findItemByQuestionId(items, slots.signes)?.optionValue;

//       if (signes && signes !== 'aucun') allSignes.push(signes);

//       const symptome =
//         this.findItemByQuestionId(items, slots.symptome)?.valueText ||
//         fiche.title?.split('–')[0]?.trim() ||
//         'un symptôme';

//       const segParts = [
//         duree ? `depuis ${duree.replace(/^depuis\s+/, '')}` : undefined,
//         siege ? `localisée ${siege}` : undefined,
//         type ? `de nature ${type.replace(/^comme\s+/, '')}` : undefined,
//         signes && signes !== 'aucun' ? `avec ${signes}` : undefined,
//       ].filter(Boolean);

//       secondaryTexts.push(`${symptome.toLowerCase()} ${segParts.join(', ')}`.trim());
//     }

//     let out = main;
//     if (secondaryTexts.length) {
//       out += ` Le patient rapporte également ${secondaryTexts.join('; ')}.`;
//     }

//     const uniqSignes = Array.from(new Set(allSignes));
//     if (uniqSignes.length > 1) {
//       out += ` L’ensemble est accompagné de ${uniqSignes.join(' et ')}.`;
//     }

//     return out.trim();
//   }

//   private renderOneResponseSummary(fiche: any, response: any): string {
//     const items = response.items || [];
//     const slots = this.buildSlotIndexFromOrders(fiche);

//     const getText = (qid?: string) => this.findItemByQuestionId(items, qid)?.valueText;
//     const getSelect = (qid?: string) => this.findItemByQuestionId(items, qid)?.optionValue;

//     const symptome = getText(slots.symptome) || fiche.title?.split('–')[0]?.trim() || 'un symptôme';
//     const mode = this.mapMode(getSelect(slots.mode));
//     const duree = this.mapDuree(getSelect(slots.duree));
//     const intensite = this.mapIntensite(getSelect(slots.intensite));
//     const siege = getText(slots.siege);
//     const type = this.mapType(getSelect(slots.type));
//     const irradiation = this.mapIrradiation(getSelect(slots.irradiation));
//     const rythme = this.mapRythme(getSelect(slots.rythme));
//     const aggravant = getText(slots.aggravants);
//     const calmant = getText(slots.calmants);
//     const signes = getSelect(slots.signes);

//     const parts: string[] = [];
//     if (mode) parts.push(mode);
//     if (duree) parts.push(duree);
//     if (intensite) parts.push(intensite);
//     if (siege) parts.push(`localisée à ${siege}`);
//     if (type) parts.push(`ressentie ${type}`);
//     if (irradiation) parts.push(irradiation);
//     if (rythme) parts.push(`(${rythme})`);
//     if (aggravant) parts.push(`aggravée par ${aggravant}`);
//     if (calmant) parts.push(`calmée par ${calmant}`);
//     if (signes && signes !== 'aucun') parts.push(`associée à ${signes}`);

//     return `Le patient présente ${symptome.toLowerCase()} ${parts.join(', ')}.`.trim();
//   }

//   private findItemByQuestionId(items: any[], qid?: string) {
//     if (!qid) return undefined;
//     return items.find(i => i.questionId === qid);
//   }

//   private buildSlotIndexFromOrders(fiche: any) {
//     const out: any = {};
//     for (const q of fiche.questions || []) {
//       switch (q.order) {
//         case 0: out.symptome = q.id; break;
//         case 1: out.mode = q.id; break;
//         case 2: out.duree = q.id; break;
//         case 3: out.intensite = q.id; break;
//         case 4: out.siege = q.id; break;
//         case 5: out.type = q.id; break;
//         case 6: out.irradiation = q.id; break;
//         case 7: out.rythme = q.id; break;
//         case 8: out.aggravants = q.id; break;
//         case 9: out.calmants = q.id; break;
//         case 10: out.signes = q.id; break;
//       }
//     }
//     return out;
//   }

//   private mapMode(v?: string) {
//     return (
//       {
//         dun_coup: 'apparue brutalement',
//         petit_a_petit: 'apparue progressivement',
//         depuis_longtemps: 'évoluant depuis longtemps',
//       }[v || ''] || undefined
//     );
//   }

//   private mapDuree(v?: string) {
//     return (
//       {
//         minutes: 'depuis quelques minutes',
//         heures: 'depuis quelques heures',
//         jours: 'depuis quelques jours',
//         semaines: 'depuis quelques semaines',
//         mois: 'depuis quelques mois',
//       }[v || ''] || undefined
//     );
//   }

//   private mapIntensite(v?: string) {
//     return (
//       {
//         leger: 'd’intensité légère (1–3/10)',
//         moyen: 'd’intensité modérée (4–6/10)',
//         fort: 'd’intensité forte (7–10/10)',
//       }[v || ''] || undefined
//     );
//   }

//   private mapType(v?: string) {
//     return (
//       {
//         brulure: 'comme une brûlure',
//         serrement: 'comme un serrement',
//         poignard: 'comme un coup de poignard',
//         lourdeur: 'comme une lourdeur',
//         autre: 'd’une autre nature',
//       }[v || ''] || undefined
//     );
//   }

//   private mapIrradiation(v?: string) {
//     return (
//       {
//         oui: 'avec irradiation',
//         non: 'sans irradiation',
//       }[v || ''] || undefined
//     );
//   }

//   private mapRythme(v?: string) {
//     return (
//       {
//         journee: 'surtout la journée',
//         nuit: 'surtout la nuit',
//         bouge: 'lors des mouvements',
//         repos: 'au repos',
//         apres_repas: 'après les repas',
//         fatigue: 'en cas de fatigue',
//       }[v || ''] || undefined
//     );
//   }

//   async generateConversationSummaryMistidracs(conversationId: number) {
//     const fiche = await this.prisma.fiche.findFirst({
//       where: {
//         requests: {
//           some: {
//             conversationId,
//           },
//         },
//       },
//       select: {
//         ficheId: true,
//         responses: true,
//       },
//     });

//     if (!fiche || !Array.isArray(fiche.responses)) {
//       throw new NotFoundException('Aucune réponse de fiche trouvée');
//     }

//     const payload = fiche.responses;

//     return this.openai.generateMistidracsSummary(
//       conversationId,
//       payload,
//     );
//   }

//   async generateConversationMistidracsGemini(conversationId: number) {
//     const fiche = await this.prisma.fiche.findFirst({
//       where: {
//         requests: {
//           some: { conversationId },
//         },
//       },
//       select: { responses: true },
//     });

//     if (!fiche || !Array.isArray(fiche.responses)) {
//       throw new NotFoundException('Aucune réponse trouvée');
//     }

//     return this.gemini.generateMistidracsSummary(
//       conversationId,
//       fiche.responses,
//     );
//   }

//   async explainFicheQuestion(
//     ficheId: number,
//     questionId: string,
//     provider: 'openai' | 'gemini' = 'openai',
//   ) {
//     const fiche = await this.prisma.fiche.findUnique({
//       where: { ficheId },
//       select: {
//         ficheId: true,
//         questions: true,
//       },
//     });

//     if (!fiche) {
//       throw new NotFoundException('Fiche introuvable');
//     }

//     const questions = fiche.questions as FicheQuestion[];

//     const question = questions.find(
//       (q) => q.id === questionId,
//     );

//     if (!question) {
//       throw new NotFoundException(
//         'Question introuvable dans cette fiche',
//       );
//     }

//     const prompt = buildExplainQuestionPrompt({
//       ficheId,
//       questionId,
//       label: question.label,
//       description: question.description,
//     });

//     if (provider === 'gemini') {
//       return this.gemini.generateJson(prompt);
//     }

//     return this.openai.generateJson(prompt);
//   }
// }


// src/messageries/messageries.service.ts
import {
  BadRequestException, ForbiddenException, Injectable, NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { SendDmMessageDto } from './dto/send-dm-message.dto';
import { QueryConversationsDto } from './dto/query-conversations.dto';
import { QueryMessagesDto } from 'src/common/dto/query-messages.dto';
import { SendFicheRequestDto } from './dto/send-fiche-request.dto';
import { SubmitFicheResponseDto } from './dto/submit-fiche-response.dto';
import { QueryConversationDetailDto } from './dto/query-conversation-detail.dto';
import { randomUUID } from 'crypto';
import { bi, isValidExpoToken, sendExpoPush } from 'src/utils/expo-push';
import { GeminiService } from 'src/ai/gemini/gemini.service';
import { OpenaiService } from 'src/ai/ai.service';
import { AiProvider } from './dto/explain-question.dto';
import { buildExplainQuestionPrompt } from 'src/ai/explain-question.prompt';
import { FicheQuestion } from 'src/fiches/types/fiche-question.type';

// Types pour les réponses avec support multi-choix
type AnswerItem = {
  questionId: string;
  valueText?: string;
  optionValue?: string | string[];
};

type FicheResponse = {
  id: string;
  conversationId: number;
  senderId: number;
  submittedForUserId: number | null;
  submittedAt: string;
  items: AnswerItem[];
};

@Injectable()
export class MessageriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly openai: OpenaiService,
    private readonly gemini: GeminiService
  ) {}

  private async getOrCreateConversation(medecinId: number, patientId: number) {
    const [med, pat] = await Promise.all([
      this.prisma.user.findUnique({ where: { userId: medecinId } }),
      this.prisma.user.findUnique({ where: { userId: patientId } }),
    ]);
    if (!med || med.userType !== 'MEDECIN') throw new NotFoundException({ message: `Médecin ${medecinId} introuvable.` });
    if (!pat || pat.userType !== 'PATIENT') throw new NotFoundException({ message: `Patient ${patientId} introuvable.` });

    const existing = await this.prisma.conversation.findUnique({
      where: { medecinId_patientId: { medecinId, patientId } },
    });
    if (existing) return existing;
    return this.prisma.conversation.create({ data: { medecinId, patientId, lastMessageAt: new Date() } });
  }

  private async createNotification(userId: number, titleFr: string, titleEn: string, msgFr: string, msgEn: string) {
    return this.prisma.notification.create({
      data: { userId, title: bi(titleFr, titleEn), message: bi(msgFr, msgEn), isRead: false },
    });
  }

  private pad2(n: number) {
    return String(n).padStart(2, '0');
  }

  private toLocalYmd(d: Date) {
    return `${d.getFullYear()}-${this.pad2(d.getMonth() + 1)}-${this.pad2(d.getDate())}`;
  }

  private toLocalHm(d: Date) {
    return `${this.pad2(d.getHours())}:${this.pad2(d.getMinutes())}`;
  }

  private normalizeHour(hourRaw: any): string {
    const raw = String(hourRaw ?? '').trim();
    const hStyle = raw.match(/^(\d{1,2})h(\d{2})$/i);
    if (hStyle) {
      const hh = this.pad2(Number(hStyle[1]));
      const mm = this.pad2(Number(hStyle[2]));
      return `${hh}:${mm}`;
    }
    const colonStyle = raw.match(/^(\d{1,2}):(\d{2})/);
    if (colonStyle) {
      const hh = this.pad2(Number(colonStyle[1]));
      const mm = this.pad2(Number(colonStyle[2]));
      return `${hh}:${mm}`;
    }
    throw new BadRequestException({
      message: `Format d'heure invalide dans la réservation: "${raw}"`,
      messageE: `Invalid reservation hour format: "${raw}"`,
    });
  }

  private parseReservationDateTime(dateStr: any, hourStr: any): Date {
    const d = String(dateStr ?? '').trim();
    const hm = this.normalizeHour(hourStr);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) {
      throw new BadRequestException({
        message: `Format de date invalide dans la réservation: "${d}"`,
        messageE: `Invalid reservation date format: "${d}"`,
      });
    }
    const dt = new Date(`${d}T${hm}:00`);
    if (isNaN(dt.getTime())) {
      throw new BadRequestException({
        message: `Date/heure de réservation invalide: "${d} ${hm}"`,
        messageE: `Invalid reservation datetime: "${d} ${hm}"`,
      });
    }
    return dt;
  }

  private formatYmdHm(d: Date) {
    return `${d.getFullYear()}-${this.pad2(d.getMonth() + 1)}-${this.pad2(d.getDate())} ${this.pad2(d.getHours())}:${this.pad2(d.getMinutes())}`;
  }

  private async assertPatientMessagingWindow(medecinId: number, patientId: number) {
    const now = new Date();
    const todayStr = this.toLocalYmd(now);
    const timeStr = this.toLocalHm(now);

    const latestPast = await this.prisma.reservation.findFirst({
      where: {
        medecinId,
        patientId,
        OR: [
          { date: { lt: todayStr } },
          { AND: [{ date: todayStr }, { hour: { lte: timeStr } }] },
        ],
      },
      orderBy: [{ date: 'desc' }, { hour: 'desc' }],
      select: { reservationId: true, date: true, hour: true },
    });

    if (!latestPast) {
      throw new ForbiddenException({
        message: "Messagerie bloquée : vous ne pouvez contacter ce médecin qu'à partir de l'heure de votre réservation (et pendant 24h). Aucune réservation passée n'a été trouvée.",
        messageE: 'Messaging blocked: you can contact this doctor only from your reservation time (and for 24h). No past reservation found.',
      });
    }

    const start = this.parseReservationDateTime(latestPast.date, latestPast.hour);
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);

    if (now.getTime() < start.getTime()) {
      throw new ForbiddenException({
        message: `Messagerie bloquée : vous pourrez contacter le médecin à partir de ${String(latestPast.date).trim()} ${this.normalizeHour(latestPast.hour)} (pendant 24h).`,
        messageE: `Messaging blocked: you can contact the doctor starting ${String(latestPast.date).trim()} ${this.normalizeHour(latestPast.hour)} (for 24h).`,
      });
    }

    if (now.getTime() > end.getTime()) {
      throw new ForbiddenException({
        message: `Messagerie bloquée : la fenêtre de 24h après votre réservation est terminée (fin : ${this.formatYmdHm(end)}).`,
        messageE: `Messaging blocked: the 24h window after your reservation is over (ends: ${this.formatYmdHm(end)}).`,
      });
    }
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

    if (senderId === conv.patientId && receiverId === conv.medecinId) {
      await this.assertPatientMessagingWindow(conv.medecinId, conv.patientId);
    }

    const created = await this.prisma.$transaction(async (tx) => {
      const msg = await tx.message.create({
        data: {
          kind: hasMeta && !hasText ? 'SYSTEM' : 'TEXT',
          conversationId: conv.conversationId,
          senderId,
          receiverId,
          content: hasText ? dto.content!.trim() : undefined,
          meta: hasMeta ? (dto.meta as any) : undefined,
          isRead: false,
        },
      });
      await tx.conversation.update({
        where: { conversationId: conv.conversationId },
        data: { lastMessageAt: new Date() },
      });
      return msg;
    });

    const [sender, receiver] = await Promise.all([
      this.prisma.user.findUnique({ where: { userId: senderId } }),
      this.prisma.user.findUnique({ where: { userId: receiverId } }),
    ]);

    const titleFr = 'Nouveau message';
    const titleEn = 'New message';
    const bodyFr = hasText ? dto.content!.trim() : 'Vous avez reçu un message.';
    const bodyEn = hasText ? dto.content!.trim() : 'You received a message.';

    if (receiver) {
      void this.createNotification(
        receiver.userId,
        titleFr, titleEn,
        `De ${sender?.firstName ?? ''} ${sender?.lastName ?? ''} — ${bodyFr}`,
        `From ${sender?.firstName ?? ''} ${sender?.lastName ?? ''} — ${bodyEn}`,
      ).catch(() => void 0);

      const token = receiver.expotoken;
      if (isValidExpoToken(token)) {
        void sendExpoPush({
          to: token!,
          sound: 'default',
          title: bi(titleFr, titleEn),
          body: bi(
            `De ${sender?.firstName ?? ''} ${sender?.lastName ?? ''}: ${bodyFr}`,
            `From ${sender?.firstName ?? ''} ${sender?.lastName ?? ''}: ${bodyEn}`
          ),
          data: { kind: 'DM', conversationId: conv.conversationId, messageId: created.messageId },
          priority: 'high',
        });
      }
    }

    return { message: 'Message envoyé', item: created };
  }

  async listConversations(query: QueryConversationsDto) {
    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 10);
    if (page < 1 || limit < 1) {
      throw new BadRequestException({ message: 'Page et limit >= 1.' });
    }
    const skip = (page - 1) * limit;

    const where: any = {};
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
          medecin: {
            select: {
              userId: true,
              firstName: true,
              lastName: true,
              profile: true,
              phone: true,
            },
          },
          patient: {
            select: {
              userId: true,
              firstName: true,
              lastName: true,
              profile: true,
              phone: true,
            },
          },
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
      unreadMap = Object.fromEntries(
        grouped.map(g => [g.conversationId!, g._count._all]),
      );
    }

    let reservationMap: Record<number, number | null> = {};

    if (rows.length) {
      const now = new Date();
      const todayStr = this.toLocalYmd(now);
      const timeStr = this.toLocalHm(now);

      const pastReservations = await this.prisma.reservation.findMany({
        where: {
          AND: [
            {
              OR: rows.map(r => ({
                medecinId: r.medecinId,
                patientId: r.patientId,
              })),
            },
            {
              OR: [
                { date: { lt: todayStr } },
                { AND: [{ date: todayStr }, { hour: { lte: timeStr } }] },
              ],
            },
          ],
        },
        orderBy: [
          { date: 'desc' },
          { hour: 'desc' },
        ],
        select: {
          reservationId: true,
          medecinId: true,
          patientId: true,
          date: true,
          hour: true,
        },
      });

      for (const conv of rows) {
        const match = pastReservations.find(
          r =>
            r.medecinId === conv.medecinId &&
            r.patientId === conv.patientId,
        );
        reservationMap[conv.conversationId] = match?.reservationId ?? null;
      }
    }

    const items = rows.map(r => ({
      conversationId: r.conversationId,
      medecin: r.medecin,
      patient: r.patient,
      lastMessageAt: r.lastMessageAt,
      lastMessage: r.messages[0] ?? null,
      unreadCountForUser: query.forUserId
        ? (unreadMap[r.conversationId] ?? 0)
        : 0,
      lastReservationId: reservationMap[r.conversationId] ?? null,
    }));

    return {
      message: 'Conversations récupérées.',
      items,
      meta: {
        total,
        page,
        limit,
        lastPage: Math.ceil(total / limit),
      },
    };
  }

  async listMessages(conversationId: number, query: QueryMessagesDto) {
    const page = Number(query.page ?? 1);
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
        orderBy: { createdAt: 'desc' },
        select: {
          messageId: true, senderId: true, receiverId: true, kind: true,
          content: true, meta: true, isRead: true, createdAt: true, ficheId: true,
          sender: { select: { userId: true, firstName: true, lastName: true, profile: true } },
          receiver: { select: { userId: true, firstName: true, lastName: true, profile: true } },
        },
      }),
      this.prisma.message.count({ where: { conversationId } }),
    ]);

    return {
      message: 'Messages récupérés.',
      items,
      meta: { total, page, limit, lastPage: Math.ceil(total / limit) }
    };
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
          content: true, meta: true, isRead: true, createdAt: true, ficheId: true,
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

    return {
      forUserId,
      dm: dmMap,
      totals: { dmTotal: Object.values(dmMap).reduce((a, b) => a + b, 0) }
    };
  }

  /* ------------------ FICHES : DEMANDE / RÉPONSE (avec support MULTI-CHOIX) ------------------ */
  async sendFicheRequest(dto: SendFicheRequestDto) {
    const [fiche, conv] = await Promise.all([
      this.prisma.fiche.findUnique({ where: { ficheId: dto.ficheId } }),
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
      });
      await tx.conversation.update({
        where: { conversationId: conv.conversationId },
        data: { lastMessageAt: new Date() },
      });
      return created;
    });

    return { message: 'Fiche demandée', item: msg };
  }

  /**
   * ✅ Version avec support des réponses MULTIPLES pour SELECT
   */
  async submitFicheResponse(dto: SubmitFicheResponseDto) {
    const [fiche, conv] = await Promise.all([
      this.prisma.fiche.findUnique({ where: { ficheId: dto.ficheId } }),
      this.prisma.conversation.findUnique({ where: { conversationId: dto.conversationId } }),
    ]);
    if (!fiche) throw new NotFoundException('Fiche introuvable');
    if (!conv) throw new NotFoundException('Conversation introuvable');

    if (dto.senderId !== conv.medecinId && dto.senderId !== conv.patientId) {
      throw new ForbiddenException(`Vous n'êtes pas participant de cette conversation.`);
    }

    if (dto.senderId === conv.patientId) {
      await this.assertPatientMessagingWindow(conv.medecinId, conv.patientId);
    }

    const questions = (fiche.questions as any[]) || [];
    const qMap = new Map(questions.map(q => [q.id, q]));
    const items: AnswerItem[] = [];

    // ✅ Validation avec support MULTI-CHOIX
    for (const a of dto.answers) {
      const q = qMap.get(a.questionId);
      if (!q) throw new BadRequestException(`questionId ${a.questionId} invalide`);

      if (q.type === 'TEXT') {
        if (!a.valueText || !a.valueText.trim()) {
          throw new BadRequestException(`valueText requis pour TEXT (question ${a.questionId})`);
        }
        if (a.optionValue) throw new BadRequestException(`optionValue interdit pour TEXT (question ${a.questionId})`);
        items.push({ questionId: a.questionId, valueText: a.valueText.trim() });
      } else { // SELECT
        if (!a.optionValue) {
          throw new BadRequestException(`optionValue requis pour SELECT (question ${a.questionId})`);
        }

        // ✅ Gestion des valeurs multiples
        const values = Array.isArray(a.optionValue) ? a.optionValue : [a.optionValue];

        // ✅ Vérifier que le nombre de valeurs correspond à ce qui est autorisé
        if (!q.multiple && values.length > 1) {
          throw new BadRequestException({
            message: `La question "${q.label}" n'autorise qu'une seule réponse mais ${values.length} ont été fournies.`,
            messageE: `Question "${q.label}" allows only one answer but ${values.length} were provided.`
          });
        }

        // ✅ Vérifier que chaque valeur est dans les options
        const validValues = q.options?.map((o: any) => o.value) || [];
        for (const val of values) {
          if (!validValues.includes(val)) {
            throw new BadRequestException({
              message: `Valeur "${val}" invalide pour la question "${q.label}"`,
              messageE: `Value "${val}" is invalid for question "${q.label}"`
            });
          }
        }

        // ✅ Stocker comme array si multiple, sinon comme string simple
        items.push({
          questionId: a.questionId,
          optionValue: q.multiple ? values : values[0]
        });
      }
    }

    // ✅ Vérifier que toutes les questions ont une réponse
    const answeredQuestionIds = items.map(i => i.questionId);
    const missingQuestions = questions
      .filter((q: any) => !answeredQuestionIds.includes(q.id))
      .map((q: any) => q.label);

    if (missingQuestions.length > 0) {
      throw new BadRequestException({
        message: `Questions sans réponse : ${missingQuestions.join(', ')}`,
        messageE: `Unanswered questions: ${missingQuestions.join(', ')}`
      });
    }

    const response: FicheResponse = {
      id: randomUUID(),
      conversationId: dto.conversationId,
      senderId: dto.senderId,
      submittedForUserId: dto.submittedForUserId ?? null,
      submittedAt: new Date().toISOString(),
      items,
    };

    const nextResponses = ([...(fiche.responses as any[] || []), response]);

    await this.prisma.fiche.update({
      where: { ficheId: fiche.ficheId },
      data: { responses: nextResponses },
    });

    const receiverId = dto.senderId === conv.medecinId ? conv.patientId : conv.medecinId;
    await this.prisma.message.create({
      data: {
        kind: 'FICHE_RESPONSE',
        conversationId: conv.conversationId,
        senderId: dto.senderId,
        receiverId,
        meta: { responseId: response.id, ficheId: fiche.ficheId, requestMessageId: dto.requestMessageId ?? null },
        isRead: false,
      } as any,
    });

    this.prisma.conversation.update({
      where: { conversationId: conv.conversationId },
      data: { lastMessageAt: new Date() },
    }).catch(() => void 0);

    return { response };
  }

  async listFicheResponsesByConversation(conversationId: number) {
    if (!conversationId || isNaN(conversationId)) {
      throw new BadRequestException('conversationId requis et doit être un entier');
    }

    const fiches = await this.prisma.fiche.findMany();
    const out: any[] = [];

    for (const f of fiches) {
      const questions = (f.questions as any[]) || [];
      const responses = (f.responses as any[]) || [];

      const forConv = responses
        .filter(r => r.conversationId === conversationId)
        .map(r => {
          const enrichedItems = (r.items || []).map((it: any) => {
            const q = questions.find(qx => qx.id === it.questionId) || null;
            return {
              questionId: it.questionId,
              optionValue: it.optionValue ?? null,
              valueText: it.valueText ?? null,
              question: q,
            };
          });

          return {
            ficheId: f.ficheId,
            ficheTitle: f.title,
            responseId: r.id,
            conversationId: r.conversationId,
            senderId: r.senderId,
            submittedForUserId: r.submittedForUserId ?? null,
            submittedAt: r.submittedAt ?? null,
            items: enrichedItems,
          };
        });

      out.push(...forConv);
    }

    out.sort((a, b) => {
      const ta = a.submittedAt ? String(a.submittedAt) : '';
      const tb = b.submittedAt ? String(b.submittedAt) : '';
      return tb.localeCompare(ta);
    });

    return { items: out };
  }

  async getFicheQuestionsAndResponses(conversationId: number, ficheId: number) {
    if (!conversationId || isNaN(conversationId) || !ficheId || isNaN(ficheId)) {
      throw new BadRequestException('conversationId et ficheId requis et doivent être des entiers');
    }

    const fiche = await this.prisma.fiche.findUnique({ where: { ficheId } });
    if (!fiche) {
      throw new NotFoundException(`Fiche ${ficheId} introuvable`);
    }

    const questions = (fiche.questions as any[]) || [];
    const responses = (fiche.responses as any[]) || [];

    const responsesForConv = responses.filter(r => r.conversationId === conversationId);

    const questionsWithResponses = questions.map(q => {
      const matched = responsesForConv
        .filter((r: any) => Array.isArray(r.items) && r.items.some((it: any) => it.questionId === q.id))
        .map((r: any) => {
          const item = (r.items || []).find((it: any) => it.questionId === q.id);
          return {
            responseId: r.id,
            submittedAt: r.submittedAt ?? null,
            senderId: r.senderId ?? null,
            submittedForUserId: r.submittedForUserId ?? null,
            valueText: item?.valueText ?? null,
            optionValue: item?.optionValue ?? null,
          };
        });

      return {
        question: q,
        responses: matched,
      };
    });

    return {
      ficheId: fiche.ficheId,
      ficheTitle: fiche.title,
      questions: questionsWithResponses,
    };
  }

  /* ------------------ RÉSUMÉS AVEC SUPPORT MULTI-CHOIX ------------------ */

  async generateConversationSummary(conversationId: number) {
    const fiches = await this.prisma.fiche.findMany();
    const entries: Array<{ fiche: any; responses: any[] }> = [];

    for (const fiche of fiches) {
      const responses = (fiche.responses as any[]) || [];
      const forConv = responses.filter(r => r.conversationId === conversationId);
      if (forConv.length) entries.push({ fiche, responses: forConv });
    }

    if (!entries.length) {
      return { conversationId, summary: 'Aucune réponse enregistrée pour cette conversation.' };
    }

    const summary = this.composeGlobalSummaryFromEntries(entries);
    return { conversationId, summary };
  }

  /**
   * ✅ Version avec support des réponses MULTIPLES dans le résumé
   */
  private composeGlobalSummaryFromEntries(entries: Array<{ fiche: any; responses: any[] }>): string {
    if (!entries.length) return '';

    const perFicheLatest = entries.map(({ fiche, responses }) => {
      const rs = [...responses].sort(
        (a, b) => new Date(a.submittedAt || 0).getTime() - new Date(b.submittedAt || 0).getTime(),
      );
      return { fiche, response: rs[rs.length - 1] };
    });

    const main = this.renderOneResponseSummary(perFicheLatest[0].fiche, perFicheLatest[0].response);

    if (perFicheLatest.length === 1) return main;

    const secondaryTexts: string[] = [];
    const allSignes: string[] = [];

    for (const { fiche, response } of perFicheLatest.slice(1)) {
      const items = response.items || [];
      const slots = this.buildSlotIndexFromOrders(fiche);

      const siege = this.findItemByQuestionId(items, slots.siege)?.valueText;
      const duree = this.mapDuree(this.findItemByQuestionId(items, slots.duree)?.optionValue);
      const type = this.mapType(this.findItemByQuestionId(items, slots.type)?.optionValue);
      const signes = this.findItemByQuestionId(items, slots.signes)?.optionValue;

      // ✅ Gestion des signes multiples
      if (signes) {
        if (Array.isArray(signes)) {
          allSignes.push(...signes.filter(s => s !== 'aucun'));
        } else if (signes !== 'aucun') {
          allSignes.push(signes);
        }
      }

      const symptome =
        this.findItemByQuestionId(items, slots.symptome)?.valueText ||
        fiche.title?.split('–')[0]?.trim() ||
        'un symptôme';

      // ✅ Formater la durée si c'est un array (avec filtre pour éviter undefined)
      let dureeText = '';
      if (duree) {
        if (Array.isArray(duree)) {
          const validDurees = duree.filter((d): d is string => 
            typeof d === 'string' && d !== undefined && d !== null
          );
          if (validDurees.length > 0) {
            dureeText = `depuis ${validDurees.map(d => d.replace(/^depuis\s+/, '')).join(' ou ')}`;
          }
        } else {
          dureeText = `depuis ${duree.replace(/^depuis\s+/, '')}`;
        }
      }

      // ✅ Formater le type si c'est un array (avec filtre pour éviter undefined)
      let typeText = '';
      if (type) {
        if (Array.isArray(type)) {
          const validTypes = type.filter((t): t is string => 
            typeof t === 'string' && t !== undefined && t !== null
          );
          if (validTypes.length > 0) {
            typeText = `de nature ${validTypes.map(t => t.replace(/^comme\s+/, '')).join(' ou ')}`;
          }
        } else {
          typeText = `de nature ${type.replace(/^comme\s+/, '')}`;
        }
      }

      // ✅ Formater les signes si multiples
      let signesText = '';
      if (signes) {
        if (Array.isArray(signes) && signes.length > 0) {
          const filtered = signes.filter(s => s !== 'aucun');
          if (filtered.length > 0) {
            signesText = `avec ${filtered.join(' et ')}`;
          }
        } else if (signes !== 'aucun') {
          signesText = `avec ${signes}`;
        }
      }

      const segParts = [
        dureeText || undefined,
        siege ? `localisée ${siege}` : undefined,
        typeText || undefined,
        signesText || undefined,
      ].filter(Boolean);

      secondaryTexts.push(`${symptome.toLowerCase()} ${segParts.join(', ')}`.trim());
    }

    let out = main;
    if (secondaryTexts.length) {
      out += ` Le patient rapporte également ${secondaryTexts.join('; ')}.`;
    }

    const uniqSignes = Array.from(new Set(allSignes));
    if (uniqSignes.length > 1) {
      out += ` L’ensemble est accompagné de ${uniqSignes.join(' et ')}.`;
    } else if (uniqSignes.length === 1) {
      out += ` L’ensemble est accompagné de ${uniqSignes[0]}.`;
    }

    return out.trim();
  }

  /**
   * ✅ Version avec support des réponses MULTIPLES
   */
  private renderOneResponseSummary(fiche: any, response: any): string {
    const items = response.items || [];
    const slots = this.buildSlotIndexFromOrders(fiche);

    const getText = (qid?: string) => this.findItemByQuestionId(items, qid)?.valueText;

    const getSelect = (qid?: string) => {
      const item = this.findItemByQuestionId(items, qid);
      return item?.optionValue;
    };

    const symptome = getText(slots.symptome) || fiche.title?.split('–')[0]?.trim() || 'un symptôme';
    const mode = this.mapMode(getSelect(slots.mode));
    const duree = this.mapDuree(getSelect(slots.duree));
    const intensite = this.mapIntensite(getSelect(slots.intensite));
    const siege = getText(slots.siege);
    const type = this.mapType(getSelect(slots.type));
    const irradiation = this.mapIrradiation(getSelect(slots.irradiation));
    const rythme = this.mapRythme(getSelect(slots.rythme));
    const aggravant = getText(slots.aggravants);
    const calmant = getText(slots.calmants);
    const signes = getSelect(slots.signes);

    const parts: string[] = [];

    if (mode) {
      if (Array.isArray(mode)) {
        const validModes = mode.filter((m): m is string => 
          typeof m === 'string' && m !== undefined && m !== null
        );
        if (validModes.length > 0) {
          parts.push(validModes.join(' ou '));
        }
      } else {
        parts.push(mode);
      }
    }

    if (duree) {
      if (Array.isArray(duree)) {
        const validDurees = duree.filter((d): d is string => 
          typeof d === 'string' && d !== undefined && d !== null
        );
        if (validDurees.length > 0) {
          parts.push(`depuis ${validDurees.map(d => d.replace(/^depuis\s+/, '')).join(' ou ')}`);
        }
      } else {
        parts.push(duree);
      }
    }

    if (intensite) {
      if (Array.isArray(intensite)) {
        const validIntensites = intensite.filter((i): i is string => 
          typeof i === 'string' && i !== undefined && i !== null
        );
        if (validIntensites.length > 0) {
          parts.push(validIntensites.join(' ou '));
        }
      } else {
        parts.push(intensite);
      }
    }

    if (siege) parts.push(`localisée à ${siege}`);

    if (type) {
      if (Array.isArray(type)) {
        const validTypes = type.filter((t): t is string => 
          typeof t === 'string' && t !== undefined && t !== null
        );
        if (validTypes.length > 0) {
          parts.push(`ressentie ${validTypes.map(t => t.replace(/^comme\s+/, '')).join(' ou ')}`);
        }
      } else {
        parts.push(`ressentie ${type}`);
      }
    }

    if (irradiation) {
      if (Array.isArray(irradiation)) {
        const validIrradiations = irradiation.filter((i): i is string => 
          typeof i === 'string' && i !== undefined && i !== null
        );
        if (validIrradiations.length > 0) {
          parts.push(validIrradiations.join(' ou '));
        }
      } else {
        parts.push(irradiation);
      }
    }

    if (rythme) {
      if (Array.isArray(rythme)) {
        const validRythmes = rythme.filter((r): r is string => 
          typeof r === 'string' && r !== undefined && r !== null
        );
        if (validRythmes.length > 0) {
          parts.push(`(${validRythmes.join(' ou ')})`);
        }
      } else {
        parts.push(`(${rythme})`);
      }
    }

    if (aggravant) parts.push(`aggravée par ${aggravant}`);
    if (calmant) parts.push(`calmée par ${calmant}`);

    if (signes) {
      if (Array.isArray(signes)) {
        const filtered = signes.filter(s => s !== 'aucun');
        if (filtered.length > 0) {
          parts.push(`associée à ${filtered.join(' et ')}`);
        }
      } else if (signes !== 'aucun') {
        parts.push(`associée à ${signes}`);
      }
    }

    return `Le patient présente ${symptome.toLowerCase()} ${parts.join(', ')}.`.trim();
  }

  private findItemByQuestionId(items: any[], qid?: string) {
    if (!qid) return undefined;
    return items.find(i => i.questionId === qid);
  }

  private buildSlotIndexFromOrders(fiche: any) {
    const out: any = {};
    for (const q of fiche.questions || []) {
      switch (q.order) {
        case 0: out.symptome = q.id; break;
        case 1: out.mode = q.id; break;
        case 2: out.duree = q.id; break;
        case 3: out.intensite = q.id; break;
        case 4: out.siege = q.id; break;
        case 5: out.type = q.id; break;
        case 6: out.irradiation = q.id; break;
        case 7: out.rythme = q.id; break;
        case 8: out.aggravants = q.id; break;
        case 9: out.calmants = q.id; break;
        case 10: out.signes = q.id; break;
      }
    }
    return out;
  }

  /**
   * ✅ Fonctions de mapping avec support des valeurs MULTIPLES (corrigées)
   */
  private mapMode(v?: string | string[]) {
    if (Array.isArray(v)) {
      const mapped = v
        .map(val => ({
          dun_coup: 'apparue brutalement',
          petit_a_petit: 'apparue progressivement',
          depuis_longtemps: 'évoluant depuis longtemps',
        }[val]))
        .filter((item): item is string => item !== undefined);
      return mapped.length ? mapped : undefined;
    }
    return (
      {
        dun_coup: 'apparue brutalement',
        petit_a_petit: 'apparue progressivement',
        depuis_longtemps: 'évoluant depuis longtemps',
      }[v || ''] || undefined
    );
  }

  private mapDuree(v?: string | string[]) {
    if (Array.isArray(v)) {
      const mapped = v
        .map(val => ({
          minutes: 'depuis quelques minutes',
          heures: 'depuis quelques heures',
          jours: 'depuis quelques jours',
          semaines: 'depuis quelques semaines',
          mois: 'depuis quelques mois',
        }[val]))
        .filter((item): item is string => item !== undefined);
      return mapped.length ? mapped : undefined;
    }
    return (
      {
        minutes: 'depuis quelques minutes',
        heures: 'depuis quelques heures',
        jours: 'depuis quelques jours',
        semaines: 'depuis quelques semaines',
        mois: 'depuis quelques mois',
      }[v || ''] || undefined
    );
  }

  private mapIntensite(v?: string | string[]) {
    if (Array.isArray(v)) {
      const mapped = v
        .map(val => ({
          leger: 'd’intensité légère (1–3/10)',
          moyen: 'd’intensité modérée (4–6/10)',
          fort: 'd’intensité forte (7–10/10)',
        }[val]))
        .filter((item): item is string => item !== undefined);
      return mapped.length ? mapped : undefined;
    }
    return (
      {
        leger: 'd’intensité légère (1–3/10)',
        moyen: 'd’intensité modérée (4–6/10)',
        fort: 'd’intensité forte (7–10/10)',
      }[v || ''] || undefined
    );
  }

  private mapType(v?: string | string[]) {
    if (Array.isArray(v)) {
      const mapped = v
        .map(val => ({
          brulure: 'comme une brûlure',
          serrement: 'comme un serrement',
          poignard: 'comme un coup de poignard',
          lourdeur: 'comme une lourdeur',
          autre: 'd’une autre nature',
        }[val]))
        .filter((item): item is string => item !== undefined);
      return mapped.length ? mapped : undefined;
    }
    return (
      {
        brulure: 'comme une brûlure',
        serrement: 'comme un serrement',
        poignard: 'comme un coup de poignard',
        lourdeur: 'comme une lourdeur',
        autre: 'd’une autre nature',
      }[v || ''] || undefined
    );
  }

  private mapIrradiation(v?: string | string[]) {
    if (Array.isArray(v)) {
      const mapped = v
        .map(val => ({
          oui: 'avec irradiation',
          non: 'sans irradiation',
        }[val]))
        .filter((item): item is string => item !== undefined);
      return mapped.length ? mapped : undefined;
    }
    return (
      {
        oui: 'avec irradiation',
        non: 'sans irradiation',
      }[v || ''] || undefined
    );
  }

  private mapRythme(v?: string | string[]) {
    if (Array.isArray(v)) {
      const mapped = v
        .map(val => ({
          journee: 'surtout la journée',
          nuit: 'surtout la nuit',
          bouge: 'lors des mouvements',
          repos: 'au repos',
          apres_repas: 'après les repas',
          fatigue: 'en cas de fatigue',
        }[val]))
        .filter((item): item is string => item !== undefined);
      return mapped.length ? mapped : undefined;
    }
    return (
      {
        journee: 'surtout la journée',
        nuit: 'surtout la nuit',
        bouge: 'lors des mouvements',
        repos: 'au repos',
        apres_repas: 'après les repas',
        fatigue: 'en cas de fatigue',
      }[v || ''] || undefined
    );
  }

  async generateConversationSummaryMistidracs(conversationId: number) {
    const fiche = await this.prisma.fiche.findFirst({
      where: {
        requests: {
          some: {
            conversationId,
          },
        },
      },
      select: {
        ficheId: true,
        responses: true,
      },
    });

    if (!fiche || !Array.isArray(fiche.responses)) {
      throw new NotFoundException('Aucune réponse de fiche trouvée');
    }

    const payload = fiche.responses;

    return this.openai.generateMistidracsSummary(
      conversationId,
      payload,
    );
  }

  async generateConversationMistidracsGemini(conversationId: number) {
    const fiche = await this.prisma.fiche.findFirst({
      where: {
        requests: {
          some: { conversationId },
        },
      },
      select: { responses: true },
    });

    if (!fiche || !Array.isArray(fiche.responses)) {
      throw new NotFoundException('Aucune réponse trouvée');
    }

    return this.gemini.generateMistidracsSummary(
      conversationId,
      fiche.responses,
    );
  }

  async explainFicheQuestion(
    ficheId: number,
    questionId: string,
    provider: 'openai' | 'gemini' = 'openai',
  ) {
    const fiche = await this.prisma.fiche.findUnique({
      where: { ficheId },
      select: {
        ficheId: true,
        questions: true,
      },
    });

    if (!fiche) {
      throw new NotFoundException('Fiche introuvable');
    }

    const questions = fiche.questions as FicheQuestion[];

    const question = questions.find(
      (q) => q.id === questionId,
    );

    if (!question) {
      throw new NotFoundException(
        'Question introuvable dans cette fiche',
      );
    }

    const prompt = buildExplainQuestionPrompt({
      ficheId,
      questionId,
      label: question.label,
      description: question.description,
    });

    if (provider === 'gemini') {
      return this.gemini.generateJson(prompt);
    }

    return this.openai.generateJson(prompt);
  }
}
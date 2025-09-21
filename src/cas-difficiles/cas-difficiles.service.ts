import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, UserType } from 'generated/prisma';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCasDto } from './dto/create-cas.dto';

import { QueryMessagesDto } from 'src/common/dto/query-messages.dto';
import { SendCasMessageDto } from './dto/send-cas-message.dto';
import { QueryCasDto } from './dto/query-cas.dto';

@Injectable()
export class CasDifficilesService {
  constructor(private readonly prisma: PrismaService) {}

  private async ensureUser(userId: number) {
    const u = await this.prisma.user.findUnique({ where: { userId } });
    if (!u) throw new NotFoundException({ message: `User ${userId} introuvable` });
    return u;
  }
  private async ensureDoctor(userId: number) {
    const u = await this.prisma.user.findUnique({ where: { userId } });
    if (!u) throw new NotFoundException({ message: `User ${userId} introuvable` });
    if (u.userType !== 'ADMIN' && u.userType !== 'MEDECIN' && u.userType !== 'SUPERADMIN') {
      throw new ForbiddenException({ message: 'Réservé aux admins/médecins' });
    }
  }

  async createCas(dto: CreateCasDto) {
    await this.ensureDoctor(dto.createdBy);
    const cas = await this.prisma.casDifficile.create({
      data: {
        name: dto.name,
        description: dto.description,
        diseaseCode: dto.diseaseCode,
        createdBy: dto.createdBy,
      },
    });
    return { item: cas };
  }

  async listCas(query: QueryCasDto) {
    const page  = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 10);
    if (page < 1 || limit < 1) throw new BadRequestException({ message: 'Page et limit >= 1' });
    const skip = (page - 1) * limit;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.casDifficile.findMany({ skip, take: limit, orderBy: { updatedAt: 'desc' } }),
      this.prisma.casDifficile.count(),
    ]);
    return { items, meta: { total, page, limit, lastPage: Math.ceil(total / limit) } };
  }

  async sendCasMessage(casId: number, dto: SendCasMessageDto) {
    const cas = await this.prisma.casDifficile.findUnique({ where: { casId } });
    if (!cas) throw new NotFoundException({ message: `Cas ${casId} introuvable` });
    await this.ensureDoctor(dto.senderId);

    const hasText = !!dto.content && dto.content.trim().length > 0;
    const hasMeta = dto.meta && Object.keys(dto.meta).length > 0;
    if (!hasText && !hasMeta) {
      throw new BadRequestException({ message: 'Fournir content ou meta' });
    }

    const msg = await this.prisma.$transaction(async (tx) => {
      const created = await tx.message.create({
        data: {
          kind: hasMeta ? 'SYSTEM' : 'TEXT',
          casId,
          senderId: dto.senderId,
          content: hasText ? dto.content!.trim() : undefined,
          meta: hasMeta ? (dto.meta as Prisma.InputJsonValue) : undefined,
          isAnonymous: !!dto.anonymous,
        },
        include: { sender: { select: { userId: true, firstName: true, lastName: true } } },
      });
      await tx.casDifficile.update({ where: { casId }, data: { updatedAt: new Date() } });
      return created;
    });
    return { item: msg };
  }

  async listCasMessages(casId: number, query: QueryMessagesDto) {
    const page  = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 20);
    if (page < 1 || limit < 1) throw new BadRequestException({ message: 'Page et limit >= 1' });
    const cas = await this.prisma.casDifficile.findUnique({ where: { casId } });
    if (!cas) throw new NotFoundException({ message: `Cas ${casId} introuvable` });

    const skip = (page - 1) * limit;
    let lastReadAt: Date | null = null;
    if (query.forUserId) {
      await this.ensureDoctor(query.forUserId);
      const st = await this.prisma.casReadState.findUnique({ where: { casId_userId: { casId, userId: query.forUserId } } });
      lastReadAt = st?.lastReadAt ?? null;
    }

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.message.findMany({
        where: { casId },
        orderBy: { createdAt: 'asc' },
        skip, take: limit,
        include: { sender: { select: { userId: true, firstName: true, lastName: true } } },
      }),
      this.prisma.message.count({ where: { casId } }),
    ]);

    const items = rows.map(m => ({
      ...m,
      shownSender: m.isAnonymous ? { userId: 0, firstName: 'Médecin', lastName: 'Anonyme' } : m.sender,
      isReadForUser: lastReadAt ? (m.createdAt <= lastReadAt) : undefined,
    }));

    return { items, meta: { total, page, limit, lastPage: Math.ceil(total / limit) } };
  }

  async markCasRead(casId: number, readerId: number) {
    await this.ensureDoctor(readerId);
    await this.prisma.casReadState.upsert({
      where: { casId_userId: { casId, userId: readerId } },
      create: { casId, userId: readerId, lastReadAt: new Date() },
      update: { lastReadAt: new Date() },
    });
    return { ok: true };
  }

  async casUnreadCount(casId: number, forUserId: number) {
    await this.ensureDoctor(forUserId);
    const st = await this.prisma.casReadState.findUnique({ where: { casId_userId: { casId, userId: forUserId } } });
    const lastReadAt = st?.lastReadAt ?? new Date(0);
    const unread = await this.prisma.message.count({
      where: { casId, createdAt: { gt: lastReadAt }, NOT: { senderId: forUserId } },
    });
    return { casId, forUserId, unread };
  }
}

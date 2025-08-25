

// ===== src/notifications/notifications.service.ts =====
import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { SaveExpoTokenDto } from './dto/save-expo-token.dto';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { QueryNotificationDto } from './dto/query-notification.dto';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  /** 1) Sauvegarder le token Expo pour l'utilisateur courant */
  async saveExpoToken( dto: SaveExpoTokenDto) {
    try {
      await this.prisma.user.update({
        where: { userId: Number(dto.userId) },
        data: { expotoken: dto.expotoken },
      });
      return {
        message: 'Token de notification enregistré.',
        messageE: 'Push token saved.',
      };
    } catch (error) {
      throw new BadRequestException({
        message: `Erreur enregistrement token : ${error.message}`,
        messageE: `Error saving token: ${error.message}`,
      });
    }
  }

  /** 2) Créer une notification */
  async create(dto: CreateNotificationDto) {
    try {
      // s'assurer que l'utilisateur cible existe
      const user = await this.prisma.user.findUnique({ where: { userId: dto.userId } });
      if (!user) {
        throw new NotFoundException({
          message: `Utilisateur ${dto.userId} introuvable.`,
          messageE: `User ${dto.userId} not found.`,
        });
      }
      const n = await this.prisma.notification.create({ data: dto });
      return {
        message: 'Notification créée avec succès.',
        messageE: 'Notification created successfully.',
        notification: n,
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException({
        message: `Erreur création notification : ${error.message}`,
        messageE: `Error creating notification: ${error.message}`,
      });
    }
  }

  /** 3) Lister (filtres + pagination) */
 async findAll(query: QueryNotificationDto) {
  try {
    const page = query.page ?? 1;
    const limit = query.limit ? Number(query.limit) : 10; // Ensure limit is a number
    if (page < 1 || limit < 1) {
      throw new BadRequestException({
        message: 'Page et limit doivent être >= 1.',
        messageE: 'Page and limit must be >= 1.',
      });
    }
    const skip = (page - 1) * limit;
    const where: any = {};
    if (query.userId) where.userId = query.userId;
    if (typeof query.isRead === 'boolean') where.isRead = query.isRead;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.notification.findMany({
        where,
        skip,
        take: limit, // Now this is guaranteed to be a number
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count({ where }),
    ]);

    return {
      message: 'Notifications récupérées.',
      messageE: 'Notifications fetched.',
      items,
      meta: { total, page, limit, lastPage: Math.ceil(total / limit) },
    };
  } catch (error) {
    if (error instanceof BadRequestException) throw error;
    throw new BadRequestException({
      message: `Erreur récupération : ${error.message}`,
      messageE: `Fetch error: ${error.message}`,
    });
  }
}

  /** 4) Récupérer une notif par ID (protéger l'accès) */
  async findOne(id: number, currentUserId: number) {
    const n = await this.prisma.notification.findUnique({ where: { notificationId: id } });
    if (!n) {
      throw new NotFoundException({
        message: `Notification ${id} introuvable.`,
        messageE: `Notification ${id} not found.`,
      });
    }
    if (n.userId !== currentUserId) {
      throw new ForbiddenException({
        message: 'Accès refusé à cette notification.',
        messageE: 'Access denied to this notification.',
      });
    }
    return {
      message: 'Notification récupérée.',
      messageE: 'Notification fetched.',
      notification: n,
    };
  }

  /** 5) Marquer une notif comme lue (PATCH) */
  async markAsRead(id: number) {
    const n = await this.prisma.notification.findUnique({ where: { notificationId: id } });
    if (!n) {
      throw new NotFoundException({
        message: `Notification ${id} introuvable.`,
        messageE: `Notification ${id} not found.`,
      });
    }
    await this.prisma.notification.update({ where: { notificationId: id }, data: { isRead: true } });
    return {
      message: 'Notification marquée comme lue.',
      messageE: 'Notification marked as read.',
      data:n
    };
  }
}


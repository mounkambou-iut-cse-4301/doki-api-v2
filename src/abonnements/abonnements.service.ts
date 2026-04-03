import {
  Injectable, BadRequestException, NotFoundException, ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { CreateAbonnementDto } from './dto/create-abonnement.dto';
import { QueryAbonnementDto } from './dto/query-abonnement.dto';
import { randomUUID } from 'crypto';
import { AbonnementStatus, TransactionStatus, TransactionType, UserType } from 'generated/prisma';
import { PrismaService } from 'src/prisma/prisma.service';
import { bi, isValidExpoToken, sendExpoPush } from 'src/utils/expo-push';

/** Minuit local (Africa/Douala) -> Date ISO (UTC) */
function dateAtLocalMidnight(tz: string, base = new Date()): Date {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit',
  });
  const [y, m, d] = fmt.format(base).split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0));
}

/** Ajoute N jours */
function addDaysUTC(d: Date, n: number): Date {
  const result = new Date(d);
  result.setUTCDate(result.getUTCDate() + n);
  return result;
}

/** Plage journée locale (Africa/Douala) pour un filtre YYYY-MM-DD */
function localDayRange(dateStr: string, tz: string): { gte: Date; lt: Date } {
  const [yyyy, mm, dd] = dateStr.split('-').map(Number);
  const startLocal = new Date(`${yyyy}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}T00:00:00`);
  const start = dateAtLocalMidnight(tz, startLocal);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { gte: start, lt: end };
}

@Injectable()
export class AbonnementsService {
  constructor(private readonly prisma: PrismaService) {}

  private async createNotification(userId: number, titleFr: string, titleEn: string, msgFr: string, msgEn: string) {
    return this.prisma.notification.create({
      data: {
        userId,
        title: bi(titleFr, titleEn),
        message: bi(msgFr, msgEn),
        isRead: false,
      },
    });
  }

  /**
   * Souscrire à un package de groupe
   */
  async subscribeToPackage(dto: CreateAbonnementDto): Promise<any> {
    // Vérifier que le patient existe
    const patient = await this.prisma.user.findUnique({
      where: { userId: dto.patientId },
    });
    
    if (!patient || patient.userType !== UserType.PATIENT) {
      throw new NotFoundException({
        message: `Patient d'ID ${dto.patientId} introuvable.`,
        messageE: `Patient with ID ${dto.patientId} not found.`,
      });
    }

    // Vérifier que le package existe et est actif
    const pkg = await this.prisma.groupePackage.findUnique({
      where: { packageId: dto.packageId },
      include: { speciality: true },
    });

    if (!pkg) {
      throw new NotFoundException({
        message: `Package d'ID ${dto.packageId} introuvable.`,
        messageE: `Package with ID ${dto.packageId} not found.`,
      });
    }

    if (!pkg.isActive) {
      throw new BadRequestException({
        message: 'Ce package n\'est pas actif.',
        messageE: 'This package is not active.',
      });
    }

    // Récupérer tous les médecins de cette spécialité
    const medecins = await this.prisma.user.findMany({
      where: {
        userType: UserType.MEDECIN,
        specialityId: pkg.specialityId,
        isBlock: false,
        isVerified: true,
      },
      select: { userId: true, firstName: true, lastName: true, expotoken: true },
    });

    // if (medecins.length === 0) {
    //   throw new NotFoundException({
    //     message: 'Aucun médecin disponible pour cette spécialité.',
    //     messageE: 'No doctor available for this speciality.',
    //   });
    // }

    // Vérifier si le patient a déjà un abonnement actif pour cette spécialité
    const existingActive = await this.prisma.abonnement.findFirst({
      where: {
        patientId: dto.patientId,
        package: {
          specialityId: pkg.specialityId,
        },
        status: AbonnementStatus.CONFIRMED,
        endDate: { gte: dateAtLocalMidnight('Africa/Douala') },
      },
    });

    if (existingActive) {
      throw new ConflictException({
        message: 'Vous avez déjà un abonnement actif pour cette spécialité.',
        messageE: 'You already have an active subscription for this speciality.',
      });
    }

    // Calculer les dates
    const debutDateObj = dateAtLocalMidnight('Africa/Douala');
    const endDateObj = addDaysUTC(debutDateObj, pkg.dureeValiditeJours);

    // Création atomique - sans medecinId car il n'existe plus dans le modèle
    const abonnement = await this.prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: { 
          amount: pkg.prix, 
          type: TransactionType.ABONNEMENT, 
          status: TransactionStatus.PENDING 
        },
      });

      return tx.abonnement.create({
        data: {
          patientId: dto.patientId,
          packageId: dto.packageId,
          debutDate: debutDateObj,
          endDate: endDateObj,
          amount: pkg.prix,
          numberOfTimePlanReservation: pkg.nombreConsultations,
          transactionId: transaction.transactionId,
          status: AbonnementStatus.PENDING,
        },
        include: {
          package: {
            include: { speciality: true },
          },
        },
      });
    });

    // 🔔 NOTIFS
    const patientTitleFr = 'Souscription à un abonnement';
    const patientTitleEn = 'Subscription purchase';
    const patientMsgFr = `Vous avez souscrit au package "${pkg.nom}". Confirmation dans quelques secondes.`;
    const patientMsgEn = `You subscribed to the package "${pkg.nom}". Confirmation in a few seconds.`;

    // Notifications patient
    void this.createNotification(
      patient.userId, 
      patientTitleFr, 
      patientTitleEn, 
      patientMsgFr, 
      patientMsgEn
    ).catch(() => void 0);

    // Notifications pour tous les médecins de la spécialité
    for (const medecin of medecins) {
      const doctorTitleFr = 'Nouvel abonnement dans votre spécialité';
      const doctorTitleEn = 'New subscription in your speciality';
      const doctorMsgFr = `Un patient a souscrit à un abonnement ${pkg.speciality.name}.`;
      const doctorMsgEn = `A patient subscribed to a ${pkg.speciality.name} package.`;

      void this.createNotification(
        medecin.userId, 
        doctorTitleFr, 
        doctorTitleEn, 
        doctorMsgFr, 
        doctorMsgEn
      ).catch(() => void 0);

      // Expo push si token valide
      if (isValidExpoToken(medecin.expotoken)) {
        void sendExpoPush({
          to: medecin.expotoken!,
          sound: 'default',
          title: bi(doctorTitleFr, doctorTitleEn),
          body: bi(doctorMsgFr, doctorMsgEn),
          data: { 
            kind: 'ABO_NEW', 
            abonnementId: abonnement.abonnementId, 
            patientId: patient.userId,
            specialityId: pkg.specialityId 
          },
          priority: 'high',
        });
      }
    }

    // ⏰ Confirmation différée (simulation paiement)
    setTimeout(async () => {
      try {
        await this.prisma.$transaction([
          this.prisma.abonnement.update({
            where: { abonnementId: abonnement.abonnementId },
            data: { status: AbonnementStatus.CONFIRMED },
          }),
          this.prisma.transaction.update({
            where: { transactionId: abonnement.transactionId! },
            data: { 
              status: TransactionStatus.PAID, 
              paymentId: `TR-ABO-${randomUUID()}` 
            },
          }),
        ]);

        // Notification de confirmation
        const confirmTitleFr = 'Abonnement confirmé';
        const confirmTitleEn = 'Subscription confirmed';
        const confirmMsgFr = `Votre abonnement "${pkg.nom}" a été confirmé. Bonne consultation !`;
        const confirmMsgEn = `Your subscription "${pkg.nom}" has been confirmed. Happy consultation!`;

        await this.createNotification(
          patient.userId,
          confirmTitleFr,
          confirmTitleEn,
          confirmMsgFr,
          confirmMsgEn
        );

      } catch (error) {
        console.error('Échec confirmation différée abonnement :', error);
      }
    }, 10_000);

    return {
      message: 'Abonnement créé avec succès',
      messageE: 'Subscription created successfully',
      messagePaiement: 'Paiement simulé - confirmation dans 10 secondes',
      abonnement,
    };
  }

  /**
   * Visualiser ses abonnements actifs (patient)
   */
  async getActiveSubscriptions(userId: number, page: number = 1, limit: number = 10) {
    if (!userId || userId <= 0) {
      throw new BadRequestException({
        message: 'ID utilisateur invalide',
        messageE: 'Invalid user ID',
      });
    }

    const user = await this.prisma.user.findUnique({
      where: { userId: userId },
      select: { userType: true },
    });

    if (!user) {
      throw new NotFoundException({ 
        message: 'Utilisateur non trouvé', 
        messageE: 'User not found' 
      });
    }

    if (user.userType !== UserType.PATIENT) {
      throw new ForbiddenException({
        message: 'Seuls les patients peuvent visualiser leurs abonnements actifs',
        messageE: 'Only patients can view their active subscriptions',
      });
    }

    const today = dateAtLocalMidnight('Africa/Douala');
    const skip = (page - 1) * limit;

    const where = {
      patientId: userId,
      status: AbonnementStatus.CONFIRMED,
      endDate: { gte: today },
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.abonnement.findMany({
        where,
        skip,
        take: limit,
        include: {
          package: {
            include: { speciality: true },
          },
        },
        orderBy: { endDate: 'asc' },
      }),
      this.prisma.abonnement.count({ where }),
    ]);

    // Compter les réservations utilisées pour chaque abonnement
    const itemsWithUsage = await Promise.all(items.map(async (abo) => {
      const reservationsCount = await this.prisma.reservation.count({
        where: {
          abonnementId: abo.abonnementId,
          status: { in: ['COMPLETED', 'PENDING'] },
        },
      });

      return {
        ...abo,
        consultationsUtilisees: reservationsCount,
        consultationsRestantes: (abo.numberOfTimePlanReservation || 0) - reservationsCount,
      };
    }));

    return {
      message: 'Abonnements actifs récupérés avec succès',
      messageE: 'Active subscriptions retrieved successfully',
      data: itemsWithUsage,
      meta: {
        total,
        page,
        limit,
        pageCount: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Consulter l'historique des abonnements (patient)
   */
  async getSubscriptionHistory(userId: number, query: QueryAbonnementDto) {
    if (!userId || userId <= 0) {
      throw new BadRequestException({
        message: 'ID utilisateur invalide',
        messageE: 'Invalid user ID',
      });
    }

    const user = await this.prisma.user.findUnique({
      where: { userId: userId },
      select: { userType: true },
    });

    if (!user) {
      throw new NotFoundException({ 
        message: 'Utilisateur non trouvé', 
        messageE: 'User not found' 
      });
    }

    if (user.userType !== UserType.PATIENT) {
      throw new ForbiddenException({
        message: 'Seuls les patients peuvent consulter leur historique d\'abonnements',
        messageE: 'Only patients can view their subscription history',
      });
    }

    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    let where: any = {
      patientId: userId,
    };

    if (query.status) {
      where.status = query.status;
    }

    if (query.packageId) {
      where.packageId = query.packageId;
    }

    if (query.specialityId) {
      where.package = {
        specialityId: query.specialityId,
      };
    }

    if (query.date) {
      const { gte, lt } = localDayRange(query.date, 'Africa/Douala');
      where.debutDate = { gte, lt };
    }

    if (query.q && query.q.trim()) {
      const q = query.q.trim();
      where.OR = [
        { package: { nom: { contains: q } } },
      ];
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.abonnement.findMany({
        where,
        skip,
        take: limit,
        include: {
          package: {
            include: { speciality: true },
          },
          transaction: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.abonnement.count({ where }),
    ]);

    const itemsWithUsage = await Promise.all(items.map(async (abo) => {
      const reservationsCount = await this.prisma.reservation.count({
        where: {
          abonnementId: abo.abonnementId,
        },
      });

      return {
        ...abo,
        consultationsUtilisees: reservationsCount,
        consultationsRestantes: (abo.numberOfTimePlanReservation || 0) - reservationsCount,
      };
    }));

    return {
      message: 'Historique des abonnements récupéré avec succès',
      messageE: 'Subscription history retrieved successfully',
      data: itemsWithUsage,
      meta: {
        total,
        page,
        limit,
        pageCount: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Médecin: Voir les abonnements de sa spécialité
   */
  async getSubscriptionsBySpeciality(userId: number, query: QueryAbonnementDto) {
    if (!userId || userId <= 0) {
      throw new BadRequestException({
        message: 'ID médecin invalide',
        messageE: 'Invalid doctor ID',
      });
    }

    const medecin = await this.prisma.user.findUnique({
      where: { userId: userId },
      include: { speciality: true },
    });

    if (!medecin || medecin.userType !== UserType.MEDECIN) {
      throw new NotFoundException({
        message: 'Médecin non trouvé',
        messageE: 'Doctor not found',
      });
    }

    if (!medecin.speciality) {
      throw new BadRequestException({
        message: 'Ce médecin n\'a pas de spécialité associée',
        messageE: 'This doctor has no associated speciality',
      });
    }

    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    let where: any = {
      package: {
        specialityId: medecin.specialityId,
      },
    };

    if (query.status) {
      where.status = query.status;
    }

    if (query.patientId) {
      where.patientId = query.patientId;
    }

    if (query.active === true) {
      const today = dateAtLocalMidnight('Africa/Douala');
      where.endDate = { gte: today };
      where.status = AbonnementStatus.CONFIRMED;
    }

    if (query.date) {
      const { gte, lt } = localDayRange(query.date, 'Africa/Douala');
      where.debutDate = { gte, lt };
    }

    if (query.q && query.q.trim()) {
      const q = query.q.trim();
      where.patient = {
        OR: [
          { firstName: { contains: q } },
          { lastName: { contains: q } },
        ],
      };
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.abonnement.findMany({
        where,
        skip,
        take: limit,
        include: {
          patient: {
            select: { userId: true, firstName: true, lastName: true, email: true, phone: true, profile: true },
          },
          package: {
            include: { speciality: true },
          },
          transaction: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.abonnement.count({ where }),
    ]);

    const itemsWithUsage = await Promise.all(items.map(async (abo) => {
      const reservationsCount = await this.prisma.reservation.count({
        where: {
          abonnementId: abo.abonnementId,
          medecinId: userId,
        },
      });

      return {
        ...abo,
        consultationsUtiliseesAvecMoi: reservationsCount,
        consultationsRestantes: (abo.numberOfTimePlanReservation || 0) - reservationsCount,
      };
    }));

    return {
      message: 'Abonnements de la spécialité récupérés avec succès',
      messageE: 'Speciality subscriptions retrieved successfully',
      data: itemsWithUsage,
      meta: {
        total,
        page,
        limit,
        pageCount: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Obtenir les détails d'un abonnement
   */
async findOne(id: number) {
  const abonnement = await this.prisma.abonnement.findUnique({
    where: { abonnementId: id },
    include: {
      patient: {
        select: { 
          userId: true, 
          firstName: true, 
          lastName: true, 
          email: true, 
          phone: true, 
          profile: true,
          createdAt: true
        },
      },
      package: {
        include: { 
          speciality: true 
        },
      },
      transaction: true,
    },
  });

  if (!abonnement) {
    throw new NotFoundException({
      message: `Abonnement d'ID ${id} introuvable.`,
      messageE: `Subscription with ID ${id} not found.`,
    });
  }

  // Compter les réservations utilisées
  const reservationsCount = await this.prisma.reservation.count({
    where: {
      abonnementId: id,
    },
  });

  // Récupérer tous les patients qui ont un abonnement actif pour ce même package
  const patientsAvecAbonnementActif = await this.prisma.abonnement.findMany({
    where: {
      packageId: abonnement.packageId,
      status: 'CONFIRMED',
      endDate: { gte: new Date() },
      abonnementId: { not: id } // Exclure l'abonnement actuel
    },
    include: {
      patient: {
        select: {
          userId: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          profile: true,
        }
      }
    },
    take: 10, // Limiter à 10 patients
  });

  return {
    message: 'Abonnement récupéré avec succès',
    messageE: 'Subscription retrieved successfully',
    data: {
      ...abonnement,
      consultationsUtilisees: reservationsCount,
      consultationsRestantes: (abonnement.numberOfTimePlanReservation || 0) - reservationsCount,
    },
  };
}
  /**
   * Lister tous les abonnements (admin)
   */
  async findAll(query: QueryAbonnementDto) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.patientId) {
      where.patientId = query.patientId;
    }

    if (query.packageId) {
      where.packageId = query.packageId;
    }

    if (query.specialityId) {
      where.package = {
        specialityId: query.specialityId,
      };
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.date) {
      const { gte, lt } = localDayRange(query.date, 'Africa/Douala');
      where.debutDate = { gte, lt };
    }

    if (query.q && query.q.trim()) {
      const q = query.q.trim();
      where.OR = [
        { patient: { OR: [{ firstName: { contains: q } }, { lastName: { contains: q } }] } },
        { package: { nom: { contains: q } } },
      ];
    }

    if (query.active === true) {
      const today = dateAtLocalMidnight('Africa/Douala');
      where.endDate = { gte: today };
      where.status = AbonnementStatus.CONFIRMED;
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.abonnement.findMany({
        where,
        skip,
        take: limit,
        include: {
          patient: {
            select: { userId: true, firstName: true, lastName: true, email: true, profile: true },
          },
          package: {
            include: { speciality: true },
          },
          transaction: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.abonnement.count({ where }),
    ]);

    return {
      message: 'Abonnements récupérés avec succès',
      messageE: 'Subscriptions retrieved successfully',
      data: items,
      meta: {
        total,
        page,
        limit,
        pageCount: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Confirmer un abonnement manuellement
   */
  async confirm(id: number): Promise<any> {
    const abo = await this.prisma.abonnement.findUnique({ 
      where: { abonnementId: id },
      include: { package: true, patient: true }
    });
    
    if (!abo) {
      throw new NotFoundException({ 
        message: `Abonnement ${id} introuvable.`, 
        messageE: `Subscription ${id} not found.` 
      });
    }
    
    if (abo.status === AbonnementStatus.CONFIRMED) {
      return { 
        message: 'Abonnement déjà confirmé.', 
        messageE: 'Subscription already confirmed.', 
        abonnement: abo 
      };
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const updAbo = await tx.abonnement.update({
        where: { abonnementId: id }, 
        data: { status: AbonnementStatus.CONFIRMED },
      });
      
      if (updAbo.transactionId) {
        await tx.transaction.update({
          where: { transactionId: updAbo.transactionId },
          data: { status: TransactionStatus.PAID, paymentId: `TR-ABO-${randomUUID()}` },
        });
      }
      
      return updAbo;
    });

    // Notification de confirmation
    if (abo.patient) {
      const confirmTitleFr = 'Abonnement confirmé';
      const confirmTitleEn = 'Subscription confirmed';
      const confirmMsgFr = `Votre abonnement "${abo.package?.nom}" a été confirmé.`;
      const confirmMsgEn = `Your subscription "${abo.package?.nom}" has been confirmed.`;

      await this.createNotification(
        abo.patient.userId,
        confirmTitleFr,
        confirmTitleEn,
        confirmMsgFr,
        confirmMsgEn
      );
    }

    return {
      message: 'Abonnement confirmé avec succès.',
      messageE: 'Subscription confirmed successfully.',
      abonnement: updated,
    };
  }
}
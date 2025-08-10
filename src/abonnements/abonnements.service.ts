import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateAbonnementDto } from './dto/create-abonnement.dto';
import { QueryAbonnementDto } from './dto/query-abonnement.dto';

import { randomUUID } from 'crypto';
import { AbonnementStatus, TransactionStatus, TransactionType, UserType } from 'generated/prisma';

/** Minuit local (Africa/Douala) -> Date ISO (UTC) */
function dateAtLocalMidnight(tz: string, base = new Date()): Date {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const [y, m, d] = fmt.format(base).split('-').map(Number); // YYYY-MM-DD
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0));
}

/** Ajoute N mois calendrier sans casser la fin de mois */
function addMonthsUTC(d: Date, n: number): Date {
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth();
  const day = d.getUTCDate();
  const res = new Date(Date.UTC(y, m + n, 1, 0, 0, 0));
  // remet le jour (si fin de mois, retombe au dernier jour du mois cible)
  const lastDayTargetMonth = new Date(Date.UTC(res.getUTCFullYear(), res.getUTCMonth() + 1, 0)).getUTCDate();
  res.setUTCDate(Math.min(day, lastDayTargetMonth));
  return res;
}

/** Plage journée locale (Africa/Douala) pour un filtre YYYY-MM-DD */
function localDayRange(dateStr: string, tz: string): { gte: Date; lt: Date } {
  const [yyyy, mm, dd] = dateStr.split('-').map(Number);
  // Construire une Date correspondant à minuit local ce jour-là
  const startLocal = new Date(`${yyyy}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}T00:00:00`);
  const start = dateAtLocalMidnight(tz, startLocal);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { gte: start, lt: end };
}

@Injectable()
export class AbonnementsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Créer un abonnement :
   * - Vérifie médecin/patient et rôles
   * - Récupère numberOfTimePlanReservation depuis la spécialité du médecin
   * - Calcule debutDate (minuit local Douala) et endDate (= +months)
   * - Crée transaction PENDING + abonnement PENDING (atomique)
   * - Après 10s, met ABO=CONFIRMED et TX=PAID (+paymentId)
   * - Renvoie toujours message / messageE
   */
  async create(dto: CreateAbonnementDto): Promise<any> {
    if (dto.months < 1 || dto.amount <= 0) {
      throw new BadRequestException({
        message: 'Mois/amount invalides.',
        messageE: 'Invalid months/amount.',
      });
    }
    if (dto.medecinId === dto.patientId) {
      throw new BadRequestException({
        message: 'Le médecin et le patient ne peuvent pas être la même personne.',
        messageE: 'Doctor and patient cannot be the same person.',
      });
    }

    // 1) Récup médecin + spécialité (pour le quota) & patient
    const [med, pat] = await Promise.all([
      this.prisma.user.findUnique({
        where: { userId: dto.medecinId },
        include: { speciality: true },
      }),
      this.prisma.user.findUnique({ where: { userId: dto.patientId } }),
    ]);

    if (!med || med.userType !== UserType.MEDECIN || !med.speciality) {
      throw new NotFoundException({
        message: `Médecin d'ID ${dto.medecinId} introuvable ou sans spécialité.`,
        messageE: `Doctor with ID ${dto.medecinId} not found or without speciality.`,
      });
    }
    if (!pat || pat.userType !== UserType.PATIENT) {
      throw new NotFoundException({
        message: `Patient d'ID ${dto.patientId} introuvable.`,
        messageE: `Patient with ID ${dto.patientId} not found.`,
      });
    }

    const maxReservations = med.speciality.numberOfTimePlanReservation;
    if (!maxReservations || maxReservations < 1) {
      throw new BadRequestException({
        message: 'Nombre de réservations par abonnement invalide.',
        messageE: 'Invalid numberOfTimePlanReservation.',
      });
    }

    // 2) Éviter un doublon d’abonnement actif qui chevauche (optionnel mais recommandé)
    const debutDateObj = dateAtLocalMidnight('Africa/Douala');
    const endDateObj = addMonthsUTC(debutDateObj, dto.months);

    const overlapping = await this.prisma.abonnement.findFirst({
      where: {
        medecinId: dto.medecinId,
        patientId: dto.patientId,
        // si un abo en cours/confimé chevauche la nouvelle période
        endDate: { gte: debutDateObj },
        status: { in: [AbonnementStatus.PENDING, AbonnementStatus.CONFIRMED] },
      },
    });
    if (overlapping) {
      throw new ConflictException({
        message: 'Un abonnement actif existe déjà pour ce médecin et ce patient.',
        messageE: 'An active subscription already exists for this doctor and patient.',
      });
    }

    // 3) Transaction + abonnement atomiques
    const abonnement = await this.prisma.$transaction(async (tx) => {
      const trx = await tx.transaction.create({
        data: {
          amount: dto.amount,
          type: TransactionType.ABONNEMENT,
          status: TransactionStatus.PENDING,
        },
      });
      return tx.abonnement.create({
        data: {
          medecinId: dto.medecinId,
          patientId: dto.patientId,
          debutDate: debutDateObj,  // DateTime attendu par Prisma
          endDate: endDateObj,      // DateTime attendu par Prisma
          amount: dto.amount,
          numberOfTimePlanReservation: maxReservations,
          transactionId: trx.transactionId,
          status: AbonnementStatus.PENDING,
        },
      });
    });

    // 4) Confirmation différée (abo + transaction) + paymentId
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
              paymentId: `TR-ABO-${randomUUID()}`,
            },
          }),
        ]);
      } catch (error) {
        // log only, on ne renvoie rien au client ici
        console.error('Échec confirmation différée abonnement/transaction :', error);
      }
    }, 10_000);

    return {
      message: 'Abonnement créé avec succès.',
      messageE: 'Subscription created successfully.',
      abonnement,
    };
  }

  /**
   * Lister les abonnements paginés avec filtres:
   * - medecinId, patientId
   * - date (YYYY-MM-DD) : filtre la journée locale Africa/Douala
   * - pagination page/limit (coercion en number)
   */
  async findAll(query: QueryAbonnementDto): Promise<any> {
    const page: number = query.page != null ? Number(query.page) : 1;
    const limit: number = query.limit != null ? Number(query.limit) : 10;

    if (Number.isNaN(page) || Number.isNaN(limit) || page < 1 || limit < 1) {
      throw new BadRequestException({
        message: 'Page et limit doivent être >= 1.',
        messageE: 'Page and limit must be >= 1.',
      });
    }
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.medecinId) where.medecinId = Number(query.medecinId);
    if (query.patientId) where.patientId = Number(query.patientId);

    if (query.date) {
      const { gte, lt } = localDayRange(query.date, 'Africa/Douala');
      where.debutDate = { gte, lt };
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.abonnement.findMany({
        where,
        skip,
        take: limit,
        orderBy: { debutDate: 'desc' },
      }),
      this.prisma.abonnement.count({ where }),
    ]);

    return {
      message: 'Abonnements récupérés.',
      messageE: 'Subscriptions fetched.',
      items,
      meta: { total, page, limit, lastPage: Math.ceil(total / limit) },
    };
  }

  /**
   * Confirmer manuellement un abonnement :
   * - Met ABO=CONFIRMED
   * - Met la transaction associée à PAID (et génère un paymentId si absent)
   */
  async confirm(id: number): Promise<any> {
    const abo = await this.prisma.abonnement.findUnique({
      where: { abonnementId: id },
    });
    if (!abo) {
      throw new NotFoundException({
        message: `Abonnement ${id} introuvable.`,
        messageE: `Subscription ${id} not found.`,
      });
    }
    if (abo.status === AbonnementStatus.CONFIRMED) {
      return {
        message: 'Abonnement déjà confirmé.',
        messageE: 'Subscription already confirmed.',
        abonnement: abo,
      };
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const updAbo = await tx.abonnement.update({
        where: { abonnementId: id },
        data: { status: AbonnementStatus.CONFIRMED },
      });

      // Récupère la transaction liée et la passe à PAID (+ paymentId si absent)
      if (updAbo.transactionId) {
        await tx.transaction.update({
          where: { transactionId: updAbo.transactionId },
          data: {
            status: TransactionStatus.PAID,
            paymentId: `TR-ABO-${randomUUID()}`,
          },
        });
      }
      return updAbo;
    });

    return {
      message: 'Abonnement confirmé avec succès.',
      messageE: 'Subscription confirmed successfully.',
      abonnement: updated,
    };
  }
}

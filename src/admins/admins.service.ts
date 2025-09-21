import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { QueryTransactionsDto } from './dto/query-transactions.dto';
import { TransactionStatus, UserType } from 'generated/prisma';

// --- Helpers TZ ---
function monthRange(year: number, month1to12: number) {
  const start = new Date(Date.UTC(year, month1to12 - 1, 1, 0, 0, 0));
  const end   = new Date(Date.UTC(year, month1to12    , 1, 0, 0, 0));
  return { gte: start, lt: end };
}
function lastMonthRangeFrom(now = new Date()) {
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth() + 1; // 1..12
  const prevM = m === 1 ? 12 : m - 1;
  const prevY = m === 1 ? y - 1 : y;
  return monthRange(prevY, prevM);
}
function lastNMonths(n: number, now = new Date()) {
  const arr: { year: number; month: number; range: { gte: Date; lt: Date } }[] = [];
  let y = now.getUTCFullYear();
  let m = now.getUTCMonth() + 1;
  for (let i = n - 1; i >= 0; i--) {
    const mm = m - i;
    const yy = y + Math.floor((mm - 1) / 12);
    const realM = ((mm - 1) % 12 + 12) % 12 + 1;
    arr.push({ year: yy, month: realM, range: monthRange(yy, realM) });
  }
  return arr;
}

@Injectable()
export class AdminsService {
  constructor(private readonly prisma: PrismaService) {}

  /** 1) Stats d'overview */
  async overview() {
    try {
      // Totaux globaux
      const [totalDoctors, totalPatients] = await Promise.all([
        this.prisma.user.count({ where: { userType: UserType.MEDECIN } }),
        this.prisma.user.count({ where: { userType: UserType.PATIENT } }),
      ]);

      // Nouveau mois dernier (requiert un champ createdAt sur User)
      const lm = lastMonthRangeFrom();
      const [lastMonthDoctors, lastMonthPatients] = await Promise.all([
        this.prisma.user.count({ where: { userType: UserType.MEDECIN, createdAt: lm } }).catch(() => 0 as any),
        this.prisma.user.count({ where: { userType: UserType.PATIENT, createdAt: lm } }).catch(() => 0 as any),
      ]);

      // Rendez-vous par status (global + dernier mois si createdAt existe)
      const rTotal = await this.prisma.reservation.groupBy({
        by: ['status'],
        _count: { _all: true },
      });
      const rMapTotal = Object.fromEntries(rTotal.map(r => [r.status, r._count._all]));

      const rLast = await this.prisma.reservation.groupBy({
        by: ['status'],
        _count: { _all: true },
        where: { createdAt: lm },
      }).catch(() => [] as any);
      const rMapLast = Object.fromEntries(rLast.map(r => [r.status, r._count._all]));

      // Transactions par status + revenu total (PAID)
      const tTotal = await this.prisma.transaction.groupBy({ by: ['status'], _count: { _all: true } });
      const tMapTotal = Object.fromEntries(tTotal.map(t => [t.status, t._count._all]));

      const revenueAgg = await this.prisma.transaction.aggregate({
        _sum: { amount: true },
        where: { status: TransactionStatus.PAID },
      });

      return {
        message: 'Statistiques chargées avec succès.',
        messageE: 'Stats loaded successfully.',
        totals: {
          doctors: totalDoctors,
          patients: totalPatients,
          lastMonth: { doctors: lastMonthDoctors, patients: lastMonthPatients },
        },
        reservationsByStatus: { total: rMapTotal, lastMonth: rMapLast },
        transactionsByStatus: tMapTotal,
        totalRevenue: revenueAgg._sum.amount ?? 0,
      };
    } catch (error) {
      throw new BadRequestException({
        message: `Erreur chargement stats : ${error.message}`,
        messageE: `Error loading stats: ${error.message}`,
      });
    }
  }

  /** 2) Top 5 médecins par note moyenne (et nombre d'avis) */
  async topDoctors() {
    try {
      const grouped = await this.prisma.feedback.groupBy({
        by: ['medecinId'],
        _avg: { note: true },
        _count: { note: true },
        orderBy: [
          { _avg: { note: 'desc' } },
          { _count: { note: 'desc' } },
        ],
        take: 5,
      });
      const ids = grouped.map(g => g.medecinId);
      const doctors = await this.prisma.user.findMany({ where: { userId: { in: ids } } });
      const map = new Map(doctors.map(d => [d.userId, d]));
      const items = grouped.map(g => ({
        medecin: map.get(g.medecinId),
        avgNote: g._avg.note ?? 0,
        reviews: g._count.note,
      }));
      return {
        message: 'Top médecins récupérés.',
        messageE: 'Top doctors fetched.',
        items,
      };
    } catch (error) {
      throw new BadRequestException({
        message: `Erreur récupération top médecins : ${error.message}`,
        messageE: `Error fetching top doctors: ${error.message}`,
      });
    }
  }

  /** 3) Revenus sur les 5 derniers mois (courant inclus) */
  async revenueLast5Months() {
    try {
      const months = lastNMonths(5);
      const data = [] as Array<{ label: string; total: number }>;
      for (const m of months) {
        const sum = await this.prisma.transaction.aggregate({
          _sum: { amount: true },
          where: {
            status: TransactionStatus.PAID,
            createdAt: m.range,
          },
        });
        const total = Number(sum._sum.amount ?? 0);
        const label = `${m.year}-${String(m.month).padStart(2, '0')}`;
        data.push({ label, total });
      }
      return {
        message: 'Revenus par mois récupérés.',
        messageE: 'Monthly revenues fetched.',
        data,
      };
    } catch (error) {
      throw new BadRequestException({
        message: `Erreur revenus 5 mois : ${error.message}`,
        messageE: `Error on 5-month revenue: ${error.message}`,
      });
    }
  }

  /** 4) Vérifier un user */
  async verifyUser(id: number) {
    try {
      const user = await this.prisma.user.findUnique({ where: { userId: id } });
      if (!user) {
        throw new NotFoundException({
          message: `Utilisateur ${id} introuvable.`,
          messageE: `User ${id} not found.`,
        });
      }
      const updated = await this.prisma.user.update({
        where: { userId: id },
        data: { isVerified: true },
      });
      return {
        message: 'Utilisateur vérifié.',
        messageE: 'User verified.',
        user: updated,
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException({
        message: `Erreur vérification utilisateur : ${error.message}`,
        messageE: `Error verifying user: ${error.message}`,
      });
    }
  }

  /** 5) Toggle block/unblock */
  async toggleBlockUser(id: number) {
    try {
      const user = await this.prisma.user.findUnique({ where: { userId: id } });
      if (!user) {
        throw new NotFoundException({
          message: `Utilisateur ${id} introuvable.`,
          messageE: `User ${id} not found.`,
        });
      }
      const updated = await this.prisma.user.update({
        where: { userId: id },
        data: { isBlock: !user.isBlock },
      });
      return {
        message: updated.isBlock ? 'Utilisateur bloqué.' : 'Utilisateur débloqué.',
        messageE: updated.isBlock ? 'User blocked.' : 'User unblocked.',
        user: updated,
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException({
        message: `Erreur toggle blocage : ${error.message}`,
        messageE: `Error toggling block: ${error.message}`,
      });
    }
  }

  /** 6) Lister transactions avec filtres + pagination */
 async listTransactions(query: QueryTransactionsDto) {
  try {
    const page  = query.page  != null ? Number(query.page)  : 1;
    const limit = query.limit != null ? Number(query.limit) : 10;
    if (page < 1 || limit < 1) {
      throw new BadRequestException({
        message: 'Page et limit doivent être >= 1.',
        messageE: 'Page and limit must be >= 1.',
      });
    }
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.type)   where.type   = query.type;
    if (query.year && query.month) where.createdAt = monthRange(query.year, query.month);
    if (query.q && query.q.trim()) {
  const q = query.q.trim();
  where.AND ??= [];
  where.AND.push({
    OR: [
      { paymentId: { contains: q } },
      { reservations: { some: {
          OR: [
            { medecin: { OR: [{ firstName: { contains: q } }, { lastName: { contains: q } }] } },
            { patient: { OR: [{ firstName: { contains: q } }, { lastName: { contains: q } }] } },
          ],
      } } },
      { abonnements: { some: {
          OR: [
            { medecin: { OR: [{ firstName: { contains: q } }, { lastName: { contains: q } }] } },
            { patient: { OR: [{ firstName: { contains: q } }, { lastName: { contains: q } }] } },
          ],
      } } },
    ],
  });
}

    const [items, total] = await this.prisma.$transaction([
      this.prisma.transaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          // <-- relations AU PLURIEL
          reservations: {
            select: { reservationId: true, medecinId: true, patientId: true, date: true, hour: true,patient:{select:{firstName:true,lastName:true}},medecin:{select:{firstName:true,lastName:true}} },
          },
          abonnements: {
            select: { abonnementId: true, medecinId: true, patientId: true, debutDate: true, endDate: true,patient:{select:{firstName:true,lastName:true}},medecin:{select:{firstName:true,lastName:true}} },
          },
        },
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return {
      message: 'Transactions récupérées.',
      messageE: 'Transactions fetched.',
      items,
      meta: { total, page, limit, lastPage: Math.ceil(total / limit) },
    };
  } catch (error) {
    if (error instanceof BadRequestException) throw error;
    throw new BadRequestException({
      message: `Erreur liste transactions : ${error.message}`,
      messageE: `Error listing transactions: ${error.message}`,
    });
  }
}


  /** 7) Détail d'une transaction + users concernés + détails liés */
 async getTransactionDetail(id: number) {
  try {
    const tx = await this.prisma.transaction.findUnique({
      where: { transactionId: id },
      include: {
        reservations: { include: { medecin: true, patient: true } }, // <-- lower camelCase
        abonnements:  true,
      },
    });
    if (!tx) {
      throw new NotFoundException({
        message: `Transaction ${id} introuvable.`,
        messageE: `Transaction ${id} not found.`,
      });
    }

    // Selon ton schéma actuel, ce sont des listes
    const res = (tx as any).reservations?.[0] ?? null;
    const abo = (tx as any).abonnements?.[0]  ?? null;

    // Médecin / Patient
    let med = res?.medecin ?? null;
    let pat = res?.patient ?? null;

    if (!med && abo) {
      // si transaction liée à un abonnement: fetch users
      [med, pat] = await Promise.all([
        this.prisma.user.findUnique({ where: { userId: abo.medecinId } }),
        this.prisma.user.findUnique({ where: { userId: abo.patientId } }),
      ]);
    }

    // Note moyenne patient↔médecin si dispo
    let ratingAvg: number | null = null;
    const medecinId = res?.medecinId ?? abo?.medecinId ?? null;
    const patientId = res?.patientId ?? abo?.patientId ?? null;
    if (medecinId && patientId) {
      const agg = await this.prisma.feedback.aggregate({
        _avg: { note: true },
        where: { medecinId, patientId },
      });
      ratingAvg = agg._avg.note ?? null;
    }

    return {
      message: 'Transaction récupérée.',
      messageE: 'Transaction fetched.',
      transaction: tx,
      medecin: med,
      patient: pat,
      related: {
        reservation: res ? { reservationId: res.reservationId } : null,
        abonnement:  abo ? { abonnementId: abo.abonnementId }   : null,
      },
      ratingAvg,
    };
  } catch (error) {
    if (error instanceof NotFoundException) throw error;
    throw new BadRequestException({
      message: `Erreur récupération transaction : ${error.message}`,
      messageE: `Error fetching transaction: ${error.message}`,
    });
  }
}

}
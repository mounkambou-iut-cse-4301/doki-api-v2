import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AbonnementStatus, TransactionStatus } from 'generated/prisma';

@Injectable()
export class StatsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Retourne:
   * - abonnés: nombre d'abonnements confirmés pour le medecin
   * - revenue: somme des transactions PAID liées aux reservations ou abonnements du medecin
   */
  async medecinStats(medecinId: number) {
    // vérifier existence medecin rapide (optionnel)
    const doc = await this.prisma.user.findUnique({ where: { userId: medecinId } });
    if (!doc) {
      throw new NotFoundException({ message: `Médecin ${medecinId} introuvable.` });
    }

    // 1) nombre d'abonnés confirmés
    const abonnésCount = await this.prisma.abonnement.count({
      where: { medecinId, status: AbonnementStatus.CONFIRMED },
    });

    // 2) revenue: somme des transactions PAID liées soit à des reservations, soit à des abonnements
    // on utilise l'aggregate sur Transaction avec filtre sur relations
    const agg = await this.prisma.transaction.aggregate({
      _sum: { amount: true },
      where: {
        status: TransactionStatus.PAID,
        OR: [
          { reservations: { some: { medecinId } } },
          { abonnements: { some: { medecinId } } },
        ],
      },
    });

    const revenue = Number(agg._sum.amount ?? 0);

    return {
      medecinId,
      abonnés: abonnésCount,
      revenue,
    };
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AbonnementStatus, TransactionStatus } from 'generated/prisma';

@Injectable()
export class StatsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Retourne:
   * - abonnés: nombre d'abonnements confirmés pour la spécialité du médecin
   * - revenue: somme des transactions PAID liées aux réservations du médecin
   */
  async medecinStats(medecinId: number) {
    // vérifier existence medecin
    const medecin = await this.prisma.user.findUnique({ 
      where: { userId: medecinId },
      include: { speciality: true }
    });
    
    if (!medecin) {
      throw new NotFoundException({ 
        message: `Médecin ${medecinId} introuvable.`,
        messageE: `Doctor ${medecinId} not found.`
      });
    }

    // 1) nombre d'abonnés confirmés pour la spécialité du médecin
    let abonnésCount = 0;
    
    if (medecin.specialityId) {
      abonnésCount = await this.prisma.abonnement.count({
        where: { 
          package: {
            specialityId: medecin.specialityId
          },
          status: AbonnementStatus.CONFIRMED 
        },
      });
    }

    // 2) revenue: somme des transactions PAID liées aux réservations du médecin
    const agg = await this.prisma.transaction.aggregate({
      _sum: { amount: true },
      where: {
        status: TransactionStatus.PAID,
        reservations: { 
          some: { medecinId } 
        },
      },
    });

    const revenue = Number(agg._sum?.amount ?? 0);

    return {
      medecinId,
      speciality: medecin.speciality?.name || null,
      abonnés: abonnésCount,
      revenue,
    };
  }
}
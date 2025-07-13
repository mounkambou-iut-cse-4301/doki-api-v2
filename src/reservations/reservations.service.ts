import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { ReservationStatus, TransactionStatus, TransactionType, UserType } from 'generated/prisma';
import { UpdateReservationDateDto } from './dto/update-reservation-date.dto';
import { QueryReservationDto } from './dto/query-reservation.dto';
import { v4 as uuidv4 } from 'uuid';
import { randomUUID } from 'crypto';

@Injectable()
export class ReservationsService {
      constructor(private readonly prisma: PrismaService) {}

/** Créer une réservation en tenant compte de consultationDuration */
  async create(dto: CreateReservationDto) {
    // 1) Valider futur
    const dateTime = new Date(`${dto.date}T${dto.hour}`);
    if (isNaN(dateTime.getTime()) || dateTime <= new Date()) {
      throw new BadRequestException({
        message: 'La date/heure doit être valide et future.',
        messageE: 'Date/time must be valid and in the future.',
      });
    }

    // 2) Vérifier médecin + patient, récupérer spécialité
    const [med, pat] = await Promise.all([
      this.prisma.user.findUnique({
        where: { userId: dto.medecinId },
        include: { speciality: true },
      }),
      this.prisma.user.findUnique({ where: { userId: dto.patientId } }),
    ]);
    if (!med || med.userType !== UserType.MEDECIN || !med.speciality) {
      throw new NotFoundException({
        message: `Médecin d'ID ${dto.medecinId} introuvable.`,
        messageE: `Doctor with ID ${dto.medecinId} not found.`,
      });
    }
    if (!pat || pat.userType !== UserType.PATIENT) {
      throw new NotFoundException({
        message: `Patient d'ID ${dto.patientId} introuvable.`,
        messageE: `Patient with ID ${dto.patientId} not found.`,
      });
    }

    // 3) Consultation duration
    const duration = med.speciality.consultationDuration;
    if (!duration || duration <= 0) {
      throw new BadRequestException({
        message: 'Durée de consultation invalide.',
        messageE: 'Invalid consultation duration.',
      });
    }

    // 4) Jour + planning
    const jours = ['dimanche','lundi','mardi','mercredi','jeudi','vendredi','samedi'];
    const jour = jours[dateTime.getDay()];
    const plan = await this.prisma.planning.findFirst({
      where: { medecinId: dto.medecinId, [jour]: true },
    });
    if (!plan || plan.isClosed) {
      throw new BadRequestException({
        message: `Médecin indisponible le ${jour}.`,
        messageE: `Doctor unavailable on ${jour}.`,
      });
    }

    // 5) Calcul des plages en minutes
    const toMin = (h: string) => {
      const [H, M] = h.split(':').map(Number);
      return H * 60 + M;
    };
    const startMin   = toMin(dto.hour);
    const endMin     = startMin + duration;
    const planStart  = toMin(plan.debutHour);
    const planEnd    = toMin(plan.endHour);

    if (startMin < planStart || endMin > planEnd) {
      throw new BadRequestException({
        message: `Créneau hors horaire (${plan.debutHour}-${plan.endHour}).`,
        messageE: `Slot outside schedule (${plan.debutHour}-${plan.endHour}).`,
      });
    }

    // 6) Chevauchement
    const others = await this.prisma.reservation.findMany({
      where: {
        medecinId: dto.medecinId,
        date:      dto.date,
      },
    });
    for (const r of others) {
      const os = toMin(r.hour);
      const oe = os + duration;
      if (startMin < oe && endMin > os) {
        throw new BadRequestException({
          message: 'Chevauchement avec une autre réservation.',
          messageE: 'Overlaps another reservation.',
        });
      }
    }

    // 7) Création transaction + réservation
    const reservation = await this.prisma.$transaction(async (tx) => {
      const trx = await tx.transaction.create({
        data: {
          amount: dto.amount,
          type:   TransactionType.RESERVATION,
          status: TransactionStatus.PENDING,
        },
      });
      return tx.reservation.create({
        data: {
          ...dto,
          transactionId: trx.transactionId,
        },
      });
    });

    // 8) Callback différé transaction + solde
    setTimeout(async () => {
      try {
        const paymentId = `TR-RES-${randomUUID()}`;
        const updateTrx = this.prisma.transaction.update({
          where: { transactionId: reservation.transactionId! },
          data: { status: TransactionStatus.PAID, paymentId },
        });
        const soldeRec = await this.prisma.soldeMedecin.findFirst({
          where: { medecinId: dto.medecinId },
        });
        const upsertSolde = soldeRec
          ? this.prisma.soldeMedecin.update({
              where: { soldeMedecinId: soldeRec.soldeMedecinId },
              data: { solde: { increment: dto.amount } },
            })
          : this.prisma.soldeMedecin.create({
              data: { medecinId: dto.medecinId, solde: dto.amount },
            });
        await this.prisma.$transaction([updateTrx, upsertSolde]);
      } catch (e) {
        console.error('Échec update différé :', e);
      }
    }, 10_000);

    return { success: true, meme: 'https://i.imgflip.com/1bhk.jpg', reservation };
  }

  /** Mettre à jour date+heure en tenant compte de consultationDuration */
  async updateDate(id: number, dto: UpdateReservationDateDto) {
    const existing = await this.prisma.reservation.findUnique({
      where: { reservationId: id },
    });
    if (!existing) {
      throw new NotFoundException({
        message: `Réservation ${id} introuvable.`,
        messageE: `Reservation ${id} not found.`,
      });
    }

    // valider futur
    const newDt = new Date(`${dto.date}T${dto.hour}`);
    if (isNaN(newDt.getTime()) || newDt <= new Date()) {
      throw new BadRequestException({
        message: 'Date/heure doit être valide et future.',
        messageE: 'Date/time must be valid and in the future.',
      });
    }

    // récupérer durée
    const med = await this.prisma.user.findUnique({
      where: { userId: existing.medecinId },
      include: { speciality: true },
    });
    const duration = med?.speciality?.consultationDuration;
    if (!duration) {
      throw new BadRequestException({
        message: 'Durée de consultation introuvable.',
        messageE: 'Consultation duration not found.',
      });
    }

    // planning & jour
    const jours = ['dimanche','lundi','mardi','mercredi','jeudi','vendredi','samedi'];
    const jour = jours[newDt.getDay()];
    const plan = await this.prisma.planning.findFirst({
      where: { medecinId: existing.medecinId, [jour]: true },
    });
    if (!plan || plan.isClosed) {
      throw new BadRequestException({
        message: `Médecin fermé le ${jour}.`,
        messageE: `Doctor closed on ${jour}.`,
      });
    }

    // calcul intervalle
    const toMin = (h: string) => {
      const [H, M] = h.split(':').map(Number);
      return H * 60 + M;
    };
    const sMin = toMin(dto.hour);
    const eMin = sMin + duration;
    const pStart = toMin(plan.debutHour);
    const pEnd   = toMin(plan.endHour);
    if (sMin < pStart || eMin > pEnd) {
      throw new BadRequestException({
        message: `Hors horaire (${plan.debutHour}-${plan.endHour}).`,
        messageE: `Outside schedule (${plan.debutHour}-${plan.endHour}).`,
      });
    }

    // chevauchement (hors courant)
    const others = await this.prisma.reservation.findMany({
      where: {
        medecinId: existing.medecinId,
        date:      dto.date,
        reservationId: { not: id },
      },
    });
    for (const r of others) {
      const os = toMin(r.hour);
      const oe = os + duration;
      if (sMin < oe && eMin > os) {
        throw new BadRequestException({
          message: 'Chevauchement avec une autre réservation.',
          messageE: 'Overlaps another reservation.',
        });
      }
    }

    // update
    const reservation = await this.prisma.reservation.update({
      where: { reservationId: id },
      data: { date: dto.date, hour: dto.hour },
    });

    return { success: true, meme: 'https://i.imgflip.com/1bhk.jpg', reservation };
  }

  /** 3. Récupérer par ID + relations */
  async findOne(id: number) {
    try {
      const res = await this.prisma.reservation.findUnique({
        where: { reservationId: id },
        include: {
          medecin:   { select: { userId: true, firstName: true, lastName: true, email: true } },
          patient:   { select: { userId: true, firstName: true, lastName: true, email: true } },
          transaction: true,
        },
      });
      if (!res) {
        throw new NotFoundException({
          message: `Réservation d'ID ${id} introuvable.`,
          messageE: `Reservation with ID ${id} not found.`,
        });
      }
      return res;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException({
        message: `Erreur récupération : ${error.message}`,
        messageE: `Error fetching reservation: ${error.message}`,
      });
    }
  }

  /** 4. Liste paginée + filtres */
 async findAll(query: QueryReservationDto) {
  try {
    // pagination
    const page: number  = query.page  != null ? Number(query.page)  : 1;
    const limit: number = query.limit != null ? Number(query.limit) : 10;
    if (page < 1 || limit < 1) {
      throw new BadRequestException({
        message: 'Page et limit doivent être >= 1',
        messageE: 'Page and limit must be >= 1',
      });
    }
    const skip = (page - 1) * limit;

    // filtres
    const where: any = {};
    if (query.medecinId) where.medecinId = Number(query.medecinId);
    if (query.patientId) where.patientId = Number(query.patientId);
    if (query.date)      where.date      = query.date;              // chaîne YYYY-MM-DD
    if (query.type)      where.type      = query.type;
    if (query.status)    where.status    = query.status;

    // exécution atomique find + count
    const [items, total] = await this.prisma.$transaction([
      this.prisma.reservation.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { date: 'asc' },
          { hour: 'asc' },
        ],
      }),
      this.prisma.reservation.count({ where }),
    ]);

    return {
      items,
      meta: {
        total,
        page,
        limit,
        lastPage: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    if (error instanceof BadRequestException) throw error;
    throw new BadRequestException({
      message: `Erreur récupération : ${error.message}`,
      messageE: `Error fetching reservations: ${error.message}`,
    });
  }
}
}

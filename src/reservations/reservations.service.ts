// import { Feedback, Speciality } from './../../generated/prisma/index.d';
// import {
//   BadRequestException,
//   ForbiddenException,
//   Injectable,
//   NotFoundException,
// } from '@nestjs/common';
// import { PrismaService } from 'src/prisma/prisma.service';
// import { CreateReservationDto } from './dto/create-reservation.dto';
// import {
//   ReservationStatus,
//   TransactionStatus,
//   TransactionType,
//   UserType,
// } from 'generated/prisma';
// import { UpdateReservationDateDto } from './dto/update-reservation-date.dto';
// import { QueryReservationDto } from './dto/query-reservation.dto';
// import { v4 as uuidv4 } from 'uuid';
// import { randomUUID } from 'crypto';
// import { RateDoctorDto } from './dto/rate-doctor.dto';
// import { profile } from 'console';

// @Injectable()
// export class ReservationsService {
//   constructor(private readonly prisma: PrismaService) {}

//   /** Créer une réservation en tenant compte de consultationDuration */
//   async create(dto: CreateReservationDto) {
//     // 1) Valider futur
//     const dateTime = new Date(`${dto.date}T${dto.hour}`);
//     if (isNaN(dateTime.getTime()) || dateTime <= new Date()) {
//       throw new BadRequestException({
//         message: 'La date/heure doit être valide et future.',
//         messageE: 'Date/time must be valid and in the future.',
//       });
//     }

//     // 2) Vérifier médecin + patient, récupérer spécialité
//     const [med, pat] = await Promise.all([
//       this.prisma.user.findUnique({
//         where: { userId: dto.medecinId },
//         include: { speciality: true },
//       }),
//       this.prisma.user.findUnique({ where: { userId: dto.patientId } }),
//     ]);
//     if (!med || med.userType !== UserType.MEDECIN || !med.speciality) {
//       throw new NotFoundException({
//         message: `Médecin d'ID ${dto.medecinId} introuvable.`,
//         messageE: `Doctor with ID ${dto.medecinId} not found.`,
//       });
//     }
//     if (!pat || pat.userType !== UserType.PATIENT) {
//       throw new NotFoundException({
//         message: `Patient d'ID ${dto.patientId} introuvable.`,
//         messageE: `Patient with ID ${dto.patientId} not found.`,
//       });
//     }

//     // 3) Consultation duration
//     const duration = med.speciality.consultationDuration;
//     if (!duration || duration <= 0) {
//       throw new BadRequestException({
//         message: 'Durée de consultation invalide.',
//         messageE: 'Invalid consultation duration.',
//       });
//     }

//     // 4) Jour + planning
//     const jours = [
//       'dimanche',
//       'lundi',
//       'mardi',
//       'mercredi',
//       'jeudi',
//       'vendredi',
//       'samedi',
//     ];
//     const jour = jours[dateTime.getDay()];
//     const plan = await this.prisma.planning.findFirst({
//       where: { medecinId: dto.medecinId, [jour]: true },
//     });
//     if (!plan || plan.isClosed) {
//       throw new BadRequestException({
//         message: `Médecin indisponible le ${jour}.`,
//         messageE: `Doctor unavailable on ${jour}.`,
//       });
//     }

//     // 5) Calcul des plages en minutes
//     const toMin = (h: string) => {
//       const [H, M] = h.split(':').map(Number);
//       return H * 60 + M;
//     };
//     const startMin = toMin(dto.hour);
//     const endMin = startMin + duration;
//     const planStart = toMin(plan.debutHour);
//     const planEnd = toMin(plan.endHour);

//     if (startMin < planStart || endMin > planEnd) {
//       throw new BadRequestException({
//         message: `Créneau hors horaire (${plan.debutHour}-${plan.endHour}).`,
//         messageE: `Slot outside schedule (${plan.debutHour}-${plan.endHour}).`,
//       });
//     }

//     // 6) Chevauchement
//     const others = await this.prisma.reservation.findMany({
//       where: {
//         medecinId: dto.medecinId,
//         date: dto.date,
//       },
//     });
//     for (const r of others) {
//       const os = toMin(r.hour);
//       const oe = os + duration;
//       if (startMin < oe && endMin > os) {
//         throw new BadRequestException({
//           message: 'Chevauchement avec une autre réservation.',
//           messageE: 'Overlaps another reservation.',
//         });
//       }
//     }

//     // 7) Création transaction + réservation
//     const reservation = await this.prisma.$transaction(async (tx) => {
//       const trx = await tx.transaction.create({
//         data: {
//           amount: dto.amount,
//           type: TransactionType.RESERVATION,
//           status: TransactionStatus.PENDING,
//         },
//       });
//       return tx.reservation.create({
//         data: {
//           ...dto,
//           transactionId: trx.transactionId,
//         },
//       });
//     });

//     // 8) Callback différé transaction + solde
//     setTimeout(async () => {
//       try {
//         const paymentId = `TR-RES-${randomUUID()}`;
//         const updateTrx = this.prisma.transaction.update({
//           where: { transactionId: reservation.transactionId! },
//           data: { status: TransactionStatus.PAID, paymentId },
//         });
//         const soldeRec = await this.prisma.soldeMedecin.findFirst({
//           where: { medecinId: dto.medecinId },
//         });
//         const upsertSolde = soldeRec
//           ? this.prisma.soldeMedecin.update({
//               where: { soldeMedecinId: soldeRec.soldeMedecinId },
//               data: { solde: { increment: dto.amount } },
//             })
//           : this.prisma.soldeMedecin.create({
//               data: { medecinId: dto.medecinId, solde: dto.amount },
//             });
//         await this.prisma.$transaction([updateTrx, upsertSolde]);
//       } catch (e) {
//         console.error('Échec update différé :', e);
//       }
//     }, 10_000);

//     return { success: true, reservation };
//   }

//   /** Mettre à jour date+heure en tenant compte de consultationDuration */
//   async updateDate(id: number, dto: UpdateReservationDateDto) {
//     const existing = await this.prisma.reservation.findUnique({
//       where: { reservationId: id },
//     });
//     if (!existing) {
//       throw new NotFoundException({
//         message: `Réservation ${id} introuvable.`,
//         messageE: `Reservation ${id} not found.`,
//       });
//     }

//     // valider futur
//     const newDt = new Date(`${dto.date}T${dto.hour}`);
//     if (isNaN(newDt.getTime()) || newDt <= new Date()) {
//       throw new BadRequestException({
//         message: 'Date/heure doit être valide et future.',
//         messageE: 'Date/time must be valid and in the future.',
//       });
//     }

//     // récupérer durée
//     const med = await this.prisma.user.findUnique({
//       where: { userId: existing.medecinId },
//       include: { speciality: true },
//     });
//     const duration = med?.speciality?.consultationDuration;
//     if (!duration) {
//       throw new BadRequestException({
//         message: 'Durée de consultation introuvable.',
//         messageE: 'Consultation duration not found.',
//       });
//     }

//     // planning & jour
//     const jours = [
//       'dimanche',
//       'lundi',
//       'mardi',
//       'mercredi',
//       'jeudi',
//       'vendredi',
//       'samedi',
//     ];
//     const jour = jours[newDt.getDay()];
//     const plan = await this.prisma.planning.findFirst({
//       where: { medecinId: existing.medecinId, [jour]: true },
//     });
//     if (!plan || plan.isClosed) {
//       throw new BadRequestException({
//         message: `Médecin fermé le ${jour}.`,
//         messageE: `Doctor closed on ${jour}.`,
//       });
//     }

//     // calcul intervalle
//     const toMin = (h: string) => {
//       const [H, M] = h.split(':').map(Number);
//       return H * 60 + M;
//     };
//     const sMin = toMin(dto.hour);
//     const eMin = sMin + duration;
//     const pStart = toMin(plan.debutHour);
//     const pEnd = toMin(plan.endHour);
//     if (sMin < pStart || eMin > pEnd) {
//       throw new BadRequestException({
//         message: `Hors horaire (${plan.debutHour}-${plan.endHour}).`,
//         messageE: `Outside schedule (${plan.debutHour}-${plan.endHour}).`,
//       });
//     }

//     // chevauchement (hors courant)
//     const others = await this.prisma.reservation.findMany({
//       where: {
//         medecinId: existing.medecinId,
//         date: dto.date,
//         reservationId: { not: id },
//       },
//     });
//     for (const r of others) {
//       const os = toMin(r.hour);
//       const oe = os + duration;
//       if (sMin < oe && eMin > os) {
//         throw new BadRequestException({
//           message: 'Chevauchement avec une autre réservation.',
//           messageE: 'Overlaps another reservation.',
//         });
//       }
//     }

//     // update
//     const reservation = await this.prisma.reservation.update({
//       where: { reservationId: id },
//       data: { date: dto.date, hour: dto.hour },
//     });

//     return { success: true, reservation };
//   }

//   /** 3. Récupérer par ID + relations */
//   // async findOne(id: number) {
//   //   try {
//   //     const res = await this.prisma.reservation.findUnique({
//   //       where: { reservationId: id },
//   //       include: {
//   //         medecin: {
//   //           select: {
//   //             userId: true,
//   //             firstName: true,
//   //             lastName: true,
//   //             email: true,
//   //                                 profile: true,
//   //           },
//   //         },
//   //         patient: {
//   //           select: {
//   //             userId: true,
//   //             firstName: true,
//   //             lastName: true,
//   //             email: true,
//   //                                 profile: true,
//   //           },
//   //         },
//   //         transaction: true,
//   //         ordonance:true
//   //       },
//   //     });
//   //     if (!res) {
//   //       throw new NotFoundException({
//   //         message: `Réservation d'ID ${id} introuvable.`,
//   //         messageE: `Reservation with ID ${id} not found.`,
//   //       });
//   //     }
//   //     return res;
//   //   } catch (error) {
//   //     if (error instanceof NotFoundException) throw error;
//   //     throw new BadRequestException({
//   //       message: `Erreur récupération : ${error.message}`,
//   //       messageE: `Error fetching reservation: ${error.message}`,
//   //     });
//   //   }
//   // }
// /** 3. Récupérer par ID + relations + rating + derniers avis */
// async findOne(id: number) {
//   try {
//     const res = await this.prisma.reservation.findUnique({
//       where: { reservationId: id },
//       include: {
//         medecin: {
//           select: {
//             userId: true,
//             firstName: true,
//             lastName: true,
//             email: true,
//             profile: true, // photo de profil
//             speciality: {  // spécialité du médecin
//               select: {
//                 specialityId: true,
//                 name: true,
//                 consultationPrice: true,
//                 consultationDuration: true,
//                 planMonthAmount: true,
//                 numberOfTimePlanReservation: true,
//               },
//             },
//           },
//         },
//         patient: {
//           select: {
//             userId: true,
//             firstName: true,
//             lastName: true,
//             email: true,
//             profile: true, // photo de profil patient (utile côté UI)
//           },
//         },
//         transaction: true,
//         ordonance: true,
//       },
//     });

//     if (!res) {
//       throw new NotFoundException({
//         message: `Réservation d'ID ${id} introuvable.`,
//         messageE: `Reservation with ID ${id} not found.`,
//       });
//     }

//     // Stats d’avis pour le médecin de cette réservation
//     const [ratingStats, lastFeedbacks] = await Promise.all([
//       this.prisma.feedback.aggregate({
//         where: { medecinId: res.medecinId },
//         _avg: { note: true },
//         _count: { _all: true },
//       }),
//       this.prisma.feedback.findMany({
//         where: { medecinId: res.medecinId },
//         orderBy: { createdAt: 'desc' },
//         take: 3, // derniers avis (ajuste si besoin)
//         include: {
//           patient: { select: { userId: true, firstName: true, lastName: true, profile: true } },
//         },
//       }),
//     ]);

//     return {
//       ...res,
//       medecinRating: {
//         average: ratingStats._avg.note ?? 0,
//         count: ratingStats._count._all,
//       },
//       lastFeedbacks, // [{note, comment, patient{...}, createdAt}, ...]
//     };
//   } catch (error) {
//     if (error instanceof NotFoundException) throw error;
//     throw new BadRequestException({
//       message: `Erreur récupération : ${error.message}`,
//       messageE: `Error fetching reservation: ${error.message}`,
//     });
//   }
// }

//   /** 4. Liste paginée + filtres */
// // async findAll(query: QueryReservationDto) {
// //   try {
// //     // Pagination
// //     const page: number = query.page != null ? Number(query.page) : 1;
// //     const limit: number = query.limit != null ? Number(query.limit) : 10;
// //     if (page < 1 || limit < 1) {
// //       throw new BadRequestException({
// //         message: 'Page et limit doivent être >= 1',
// //         messageE: 'Page and limit must be >= 1',
// //       });
// //     }
// //     const skip = (page - 1) * limit;

// //     // Filtres
// //     const where: any = {};
// //     if (query.medecinId) where.medecinId = Number(query.medecinId);
// //     if (query.patientId) where.patientId = Number(query.patientId);
// //     if (query.date) where.date = query.date; // chaîne YYYY-MM-DD
// //     if (query.type) where.type = query.type;
// //     if (query.status) where.status = query.status;

// //     // Inclure seulement les noms des médecins et des patients
// //     const include = {
// //       medecin: {
// //         select: {
// //           firstName: true,
// //           lastName: true,


// //         },
// //       },
// //       patient: {
// //         select: {
// //           firstName: true,
// //           lastName: true,


// //      },
// //       },
// //     };

// //     // Exécution atomique find + count
// //     const [items, total] = await this.prisma.$transaction([
// //       this.prisma.reservation.findMany({
// //         where,
// //         skip,
// //         take: limit,
// //         orderBy: [{ date: 'asc' }, { hour: 'asc' }],
// //         include,
// //       }),
// //       this.prisma.reservation.count({ where }),
// //     ]);

// //     return {
// //       items,
// //       meta: {
// //         total,
// //         page,
// //         limit,
// //         lastPage: Math.ceil(total / limit),
// //       },
// //     };
// //   } catch (error) {
// //     if (error instanceof BadRequestException) throw error;
// //     throw new BadRequestException({
// //       message: `Erreur récupération : ${error.message}`,
// //       messageE: `Error fetching reservations: ${error.message}`,
// //     });
// //   }
// // }
// /** 4. Liste paginée + filtres + profil + spécialité + rating résumé */
// async findAll(query: QueryReservationDto) {
//   try {
//     // Pagination
//     const page: number = query.page != null ? Number(query.page) : 1;
//     const limit: number = query.limit != null ? Number(query.limit) : 10;
//     if (page < 1 || limit < 1) {
//       throw new BadRequestException({
//         message: 'Page et limit doivent être >= 1',
//         messageE: 'Page and limit must be >= 1',
//       });
//     }
//     const skip = (page - 1) * limit;

//     // Filtres
//     const where: any = {};
//     if (query.medecinId) where.medecinId = Number(query.medecinId);
//     if (query.patientId) where.patientId = Number(query.patientId);
//     if (query.date) where.date = query.date;
//     if (query.type) where.type = query.type;
//     if (query.status) where.status = query.status;
//     if (query.q && query.q.trim()) {
//   const q = query.q.trim();
//   where.AND ??= [];
//   where.AND.push({
//     OR: [
//       { patientName: { contains: q } },
//       { medecin: { OR: [{ firstName: { contains: q } }, { lastName:  { contains: q } }] } },
//       { patient: { OR: [{ firstName: { contains: q } }, { lastName:  { contains: q } }] } },
//     ],
//   });
// }


//     // On inclut profil + spécialité pour le médecin, et profil pour le patient
//     const include = {
//       medecin: {
//         select: {
//           userId: true,
//           firstName: true,
//           lastName: true,
//           profile: true,
//           speciality: {
//             select: {
//               specialityId: true,
//               name: true,
//               consultationPrice: true,
//               consultationDuration: true,
//               planMonthAmount: true,
//               numberOfTimePlanReservation: true,
//             },
//           },
//         },
//       },
//       patient: {
//         select: {
//           userId: true,
//           firstName: true,
//           lastName: true,
//           profile: true,
//         },
//       },
//     } as const;

//     // Exécution atomique find + count
//     const [items, total] = await this.prisma.$transaction([
//       this.prisma.reservation.findMany({
//         where,
//         skip,
//         take: limit,
//         orderBy: [{ date: 'asc' }, { hour: 'asc' }],
//         include,
//       }),
//       this.prisma.reservation.count({ where }),
//     ]);

//     // —— Récupérer les ratings des médecins affichés (en 1 batch) ——
//     const medecinIds = Array.from(new Set(items.map(i => i.medecinId)));
//     // groupBy retourne une ligne par medecinId avec _avg.note et _count
//     const ratingRows = await this.prisma.feedback.groupBy({
//       by: ['medecinId'],
//       where: { medecinId: { in: medecinIds } },
//       _avg: { note: true },
//       _count: { _all: true },
//     });
//     const ratingMap = new Map<number, { average: number; count: number }>();
//     for (const r of ratingRows) {
//       ratingMap.set(r.medecinId, {
//         average: r._avg.note ?? 0,
//         count: r._count._all,
//       });
//     }

//     // Attacher les ratings à chaque item
//     const itemsWithRatings = items.map(it => ({
//       ...it,
//       medecinRating: ratingMap.get(it.medecinId) ?? { average: 0, count: 0 },
//     }));

//     return {
//       items: itemsWithRatings,
//       meta: {
//         total,
//         page,
//         limit,
//         lastPage: Math.ceil(total / limit),
//       },
//     };
//   } catch (error) {
//     if (error instanceof BadRequestException) throw error;
//     throw new BadRequestException({
//       message: `Erreur récupération : ${error.message}`,
//       messageE: `Error fetching reservations: ${error.message}`,
//     });
//   }
// }

//   async completeReservation(id: number) {
//     // 1) Charger la réservation + médecin + spécialité
//     const res = await this.prisma.reservation.findUnique({
//       where: { reservationId: id },
//       include: {
//         medecin: { include: { speciality: true } },
//       },
//     });
//     if (!res) {
//       throw new NotFoundException({
//         message: `Réservation ${id} introuvable.`,
//         messageE: `Reservation ${id} not found.`,
//       });
//     }
//     if (res.status !== ReservationStatus.PENDING) {
//       throw new BadRequestException({
//         message: `Impossible de compléter une réservation au statut '${res.status}'.`,
//         messageE: `Cannot complete reservation with status '${res.status}'.`,
//       });
//     }

//     // 2) S’assurer qu’on a bien la spécialité et sa durée
//     const { date, hour, medecin } = res;
//     if (!medecin.speciality) {
//       throw new BadRequestException({
//         message: 'Spécialité du médecin introuvable.',
//         messageE: 'Doctor speciality not found.',
//       });
//     }
//     const duration = medecin.speciality.consultationDuration;

//     // 3) Calculer l’heure de fin et vérifier l’attente de 30 min
//     const endDate = new Date(`${date}T${hour}`);
//     endDate.setMinutes(endDate.getMinutes() + duration);
//     const now = new Date();
//     if (now.getTime() < endDate.getTime() + 30 * 60 * 1000) {
//       throw new BadRequestException({
//         message: 'On ne peut pas compléter avant 30 min après la fin prévue.',
//         messageE: 'Cannot complete until 30 min after scheduled end.',
//       });
//     }

//     // 4) Mettre à jour le statut
//     const updated = await this.prisma.reservation.update({
//       where: { reservationId: id },
//       data: { status: ReservationStatus.COMPLETED },
//     });

//     return {
//       success: true,
//       reservation: updated,
//     };
//   }

//  async rateDoctor(reservationId: number, dto: RateDoctorDto) {
//     // 1) Charger la réservation
//     const res = await this.prisma.reservation.findUnique({
//       where: { reservationId },
//     });
//     if (!res) {
//       throw new NotFoundException({
//         message: `Réservation ${reservationId} introuvable.`,
//         messageE: `Reservation ${reservationId} not found.`,
//       });
//     }

//     // 2) Statut COMPLETED requis
//     if (res.status !== ReservationStatus.COMPLETED) {
//       throw new BadRequestException({
//         message: 'Vous ne pouvez noter qu’après une réservation complétée.',
//         messageE: 'You can only rate after a completed reservation.',
//       });
//     }

//     // 3) Vérifier medecinId et patientId
//     if (dto.medecinId !== res.medecinId || dto.patientId !== res.patientId) {
//       throw new ForbiddenException({
//         message: 'medecinId ou patientId invalide pour cette réservation.',
//         messageE: 'medecinId or patientId does not match this reservation.',
//       });
//     }

//     // 4) Créer le feedback
//     const feedback = await this.prisma.feedback.create({
//       data: {
//         medecinId: dto.medecinId,
//         patientId: dto.patientId,
//         note:      dto.note,
//         comment:   dto.comment,
//       },
//     });

//     return {
//       success:  true,
//       feedback,
//     };
//   }
// }

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import {
  ReservationStatus,
  TransactionStatus,
  TransactionType,
  UserType,
} from 'generated/prisma';
import { UpdateReservationDateDto } from './dto/update-reservation-date.dto';
import { QueryReservationDto } from './dto/query-reservation.dto';
import { randomUUID } from 'crypto';
import { RateDoctorDto } from './dto/rate-doctor.dto';

@Injectable()
export class ReservationsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Créer une réservation : le montant vient de la spécialité (`specialityId`) */
  async create(dto: CreateReservationDto) {
    // 1) Valider futur
    const dateTime = new Date(`${dto.date}T${dto.hour}`);
    if (isNaN(dateTime.getTime()) || dateTime <= new Date()) {
      throw new BadRequestException({
        message: 'La date/heure doit être valide et future.',
        messageE: 'Date/time must be valid and in the future.',
      });
    }

    // 2) Vérifier médecin + patient
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

    // 3) Récupérer la spécialité demandée et son prix (amount)
    if (!dto.specialityId) {
      throw new BadRequestException({
        message: 'specialityId est requis.',
        messageE: 'specialityId is required.',
      });
    }
    const speciality = await this.prisma.speciality.findUnique({
      where: { specialityId: dto.specialityId },
    });
    if (!speciality) {
      throw new NotFoundException({
        message: `Spécialité ${dto.specialityId} introuvable.`,
        messageE: `Speciality ${dto.specialityId} not found.`,
      });
    }

    // (optionnel mais conseillé) Vérifier cohérence médecin ↔ spécialité
    if (med.specialityId !== dto.specialityId) {
      throw new BadRequestException({
        message: `La spécialité ne correspond pas au médecin.`,
        messageE: `Speciality does not match the doctor.`,
      });
    }

    const amount = Number(speciality.consultationPrice); // Decimal -> number

    // 4) Durée consultation (depuis spécialité du médecin)
    const duration = med.speciality.consultationDuration;
    if (!duration || duration <= 0) {
      throw new BadRequestException({
        message: 'Durée de consultation invalide.',
        messageE: 'Invalid consultation duration.',
      });
    }

    // 5) Jour + planning
    const jours = [
      'dimanche',
      'lundi',
      'mardi',
      'mercredi',
      'jeudi',
      'vendredi',
      'samedi',
    ];
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

    // 6) Calcul des plages en minutes + vérifs chevauchement
    const toMin = (h: string) => {
      const [H, M] = h.split(':').map(Number);
      return H * 60 + M;
    };
    const startMin = toMin(dto.hour);
    const endMin = startMin + duration;
    const planStart = toMin(plan.debutHour);
    const planEnd = toMin(plan.endHour);

    if (startMin < planStart || endMin > planEnd) {
      throw new BadRequestException({
        message: `Créneau hors horaire (${plan.debutHour}-${plan.endHour}).`,
        messageE: `Slot outside schedule (${plan.debutHour}-${plan.endHour}).`,
      });
    }

    const others = await this.prisma.reservation.findMany({
      where: {
        medecinId: dto.medecinId,
        date: dto.date,
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

    // 7) Création transaction + réservation (amount issu de la spécialité)
    const reservation = await this.prisma.$transaction(async (tx) => {
      const trx = await tx.transaction.create({
        data: {
          amount,
          type: TransactionType.RESERVATION,
          status: TransactionStatus.PENDING,
        },
      });
      return tx.reservation.create({
        data: {
          date: dto.date,
          hour: dto.hour,
          type: dto.type,
          patientName: dto.patientName,
          sex: dto.sex,
          age: dto.age,
          description: dto.description,
          medecinId: dto.medecinId,
          patientId: dto.patientId,
          location: dto.location,
          amount, // <-- on enregistre aussi sur la réservation
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
              data: { solde: { increment: amount } },
            })
          : this.prisma.soldeMedecin.create({
              data: { medecinId: dto.medecinId, solde: amount },
            });
        await this.prisma.$transaction([updateTrx, upsertSolde]);
      } catch (e) {
        console.error('Échec update différé :', e);
      }
    }, 10_000);

    return { success: true, reservation };
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

    // récupérer durée (via spécialité du médecin de la réservation)
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
    const jours = [
      'dimanche',
      'lundi',
      'mardi',
      'mercredi',
      'jeudi',
      'vendredi',
      'samedi',
    ];
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

    // calcul intervalle + chevauchement
    const toMin = (h: string) => {
      const [H, M] = h.split(':').map(Number);
      return H * 60 + M;
    };
    const sMin = toMin(dto.hour);
    const eMin = sMin + duration;
    const pStart = toMin(plan.debutHour);
    const pEnd = toMin(plan.endHour);
    if (sMin < pStart || eMin > pEnd) {
      throw new BadRequestException({
        message: `Hors horaire (${plan.debutHour}-${plan.endHour}).`,
        messageE: `Outside schedule (${plan.debutHour}-${plan.endHour}).`,
      });
    }

    const others = await this.prisma.reservation.findMany({
      where: {
        medecinId: existing.medecinId,
        date: dto.date,
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

    return { success: true, reservation };
  }

  /** 3. Récupérer par ID + relations + rating + 3 derniers avis */
  async findOne(id: number) {
    try {
      const res = await this.prisma.reservation.findUnique({
        where: { reservationId: id },
        include: {
          medecin: {
            select: {
              userId: true,
              firstName: true,
              lastName: true,
              email: true,
              profile: true,
              speciality: {
                select: {
                  specialityId: true,
                  name: true,
                  consultationPrice: true,
                  consultationDuration: true,
                  planMonthAmount: true,
                  numberOfTimePlanReservation: true,
                },
              },
            },
          },
          patient: {
            select: {
              userId: true,
              firstName: true,
              lastName: true,
              email: true,
              profile: true,
            },
          },
          transaction: true,
          ordonance: true,
        },
      });

      if (!res) {
        throw new NotFoundException({
          message: `Réservation d'ID ${id} introuvable.`,
          messageE: `Reservation with ID ${id} not found.`,
        });
      }

      // Stats d’avis pour le médecin + 3 derniers avis
      const [ratingStats, lastFeedbacks] = await Promise.all([
        this.prisma.feedback.aggregate({
          where: { medecinId: res.medecinId },
          _avg: { note: true },
          _count: { _all: true },
        }),
        this.prisma.feedback.findMany({
          where: { medecinId: res.medecinId },
          orderBy: { createdAt: 'desc' },
          take: 3,
          include: {
            patient: {
              select: {
                userId: true,
                firstName: true,
                lastName: true,
                profile: true,
              },
            },
          },
        }),
      ]);

      return {
        ...res,
        medecinRating: {
          average: ratingStats._avg.note ?? 0,
          count: ratingStats._count._all,
        },
        lastFeedbacks,
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException({
        message: `Erreur récupération : ${error.message}`,
        messageE: `Error fetching reservation: ${error.message}`,
      });
    }
  }

  /** 4. Liste paginée + filtres + recherche + profil + spécialité + rating résumé */
  async findAll(query: QueryReservationDto) {
    try {
      // Pagination
      const page: number = query.page != null ? Number(query.page) : 1;
      const limit: number = query.limit != null ? Number(query.limit) : 10;
      if (page < 1 || limit < 1) {
        throw new BadRequestException({
          message: 'Page et limit doivent être >= 1',
          messageE: 'Page and limit must be >= 1',
        });
      }
      const skip = (page - 1) * limit;

      // Filtres
      const where: any = {};
      if (query.medecinId) where.medecinId = Number(query.medecinId);
      if (query.patientId) where.patientId = Number(query.patientId);
      if (query.date) where.date = query.date;
      if (query.type) where.type = query.type;
      if (query.status) where.status = query.status;
      if (query.q && query.q.trim()) {
        const q = query.q.trim();
        where.AND ??= [];
        where.AND.push({
          OR: [
            { patientName: { contains: q } },
            {
              medecin: {
                OR: [
                  { firstName: { contains: q } },
                  { lastName: { contains: q } },
                ],
              },
            },
            {
              patient: {
                OR: [
                  { firstName: { contains: q } },
                  { lastName: { contains: q } },
                ],
              },
            },
          ],
        });
      }

      // Inclusions
      const include = {
        medecin: {
          select: {
            userId: true,
            firstName: true,
            lastName: true,
            profile: true,
            speciality: {
              select: {
                specialityId: true,
                name: true,
                consultationPrice: true,
                consultationDuration: true,
                planMonthAmount: true,
                numberOfTimePlanReservation: true,
              },
            },
          },
        },
        patient: {
          select: {
            userId: true,
            firstName: true,
            lastName: true,
            profile: true,
          },
        },
      } as const;

      const [items, total] = await this.prisma.$transaction([
        this.prisma.reservation.findMany({
          where,
          skip,
          take: limit,
          orderBy: [{ date: 'asc' }, { hour: 'asc' }],
          include,
        }),
        this.prisma.reservation.count({ where }),
      ]);

      // Ratings des médecins (batch)
      const medecinIds = Array.from(new Set(items.map((i) => i.medecinId)));
      const ratingRows = await this.prisma.feedback.groupBy({
        by: ['medecinId'],
        where: { medecinId: { in: medecinIds } },
        _avg: { note: true },
        _count: { _all: true },
      });
      const ratingMap = new Map<number, { average: number; count: number }>();
      for (const r of ratingRows) {
        ratingMap.set(r.medecinId, {
          average: r._avg.note ?? 0,
          count: r._count._all,
        });
      }

      const itemsWithRatings = items.map((it) => ({
        ...it,
        medecinRating: ratingMap.get(it.medecinId) ?? { average: 0, count: 0 },
      }));

      return {
        items: itemsWithRatings,
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

  /** 5. Compléter une réservation (30 min après la fin prévue) */
  async completeReservation(id: number) {
    const res = await this.prisma.reservation.findUnique({
      where: { reservationId: id },
      include: { medecin: { include: { speciality: true } } },
    });
    if (!res) {
      throw new NotFoundException({
        message: `Réservation ${id} introuvable.`,
        messageE: `Reservation ${id} not found.`,
      });
    }
    if (res.status !== ReservationStatus.PENDING) {
      throw new BadRequestException({
        message: `Impossible de compléter une réservation au statut '${res.status}'.`,
        messageE: `Cannot complete reservation with status '${res.status}'.`,
      });
    }
    if (!res.medecin.speciality) {
      throw new BadRequestException({
        message: 'Spécialité du médecin introuvable.',
        messageE: 'Doctor speciality not found.',
      });
    }
    const duration = res.medecin.speciality.consultationDuration;

    const endDate = new Date(`${res.date}T${res.hour}`);
    endDate.setMinutes(endDate.getMinutes() + duration);
    const now = new Date();
    if (now.getTime() < endDate.getTime() + 30 * 60 * 1000) {
      throw new BadRequestException({
        message: 'On ne peut pas compléter avant 30 min après la fin prévue.',
        messageE: 'Cannot complete until 30 min after scheduled end.',
      });
    }

    const updated = await this.prisma.reservation.update({
      where: { reservationId: id },
      data: { status: ReservationStatus.COMPLETED },
    });

    return { success: true, reservation: updated };
  }

  /** 6. Noter un médecin après une réservation complétée */
  async rateDoctor(reservationId: number, dto: RateDoctorDto) {
    const res = await this.prisma.reservation.findUnique({
      where: { reservationId },
    });
    if (!res) {
      throw new NotFoundException({
        message: `Réservation ${reservationId} introuvable.`,
        messageE: `Reservation ${reservationId} not found.`,
      });
    }
    if (res.status !== ReservationStatus.COMPLETED) {
      throw new BadRequestException({
        message: 'Vous ne pouvez noter qu’après une réservation complétée.',
        messageE: 'You can only rate after a completed reservation.',
      });
    }
    if (dto.medecinId !== res.medecinId || dto.patientId !== res.patientId) {
      throw new ForbiddenException({
        message: 'medecinId ou patientId invalide pour cette réservation.',
        messageE: 'medecinId or patientId does not match this reservation.',
      });
    }

    const feedback = await this.prisma.feedback.create({
      data: {
        medecinId: dto.medecinId,
        patientId: dto.patientId,
        note: dto.note,
        comment: dto.comment,
      },
    });

    return { success: true, feedback };
  }
}

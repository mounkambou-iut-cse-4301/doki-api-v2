

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
  AbonnementStatus,
  PlanningType,
} from 'generated/prisma';
import { UpdateReservationDateDto } from './dto/update-reservation-date.dto';
import { QueryReservationDto } from './dto/query-reservation.dto';
import { randomUUID } from 'crypto';
import { RateDoctorDto } from './dto/rate-doctor.dto';
import { bi, isValidExpoToken, sendExpoPush } from 'src/utils/expo-push';
import {
  addToEncryptedBalance,
  encryptBalance,
} from 'src/utils/secure-balance';
function toMinutes(hour: string): number {
  const parts = hour.split(':');
  const H = parseInt(parts[0], 10);
  const M = parseInt(parts[1], 10);
  return H * 60 + M;
}

function addMinutesToHourString(hour: string, minutesToAdd: number): string {
  const parts = hour.split(':');
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  const date = new Date();
  date.setHours(h, m, 0, 0);
  date.setMinutes(date.getMinutes() + minutesToAdd);
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

function toDisplayHour(hour: string): string {
  return hour.split(':').slice(0, 2).join(':');
}

function dateAtLocalMidnight(tz: string, base = new Date()): Date {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const [y, m, d] = fmt.format(base).split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0));
}

const PAUSE_MINUTES = 5;

@Injectable()
export class ReservationsService {
  constructor(private readonly prisma: PrismaService) {}

  private async createNotification(
    userId: number,
    titleFr: string,
    titleEn: string,
    msgFr: string,
    msgEn: string,
  ) {
    return this.prisma.notification.create({
      data: {
        userId,
        title: bi(titleFr, titleEn),
        message: bi(msgFr, msgEn),
        isRead: false,
      },
    });
  }

  private async pushIfPossible(
    expoToken: string | null | undefined,
    titleFr: string,
    titleEn: string,
    msgFr: string,
    msgEn: string,
    data?: Record<string, any>,
  ) {
    if (!isValidExpoToken(expoToken)) return;

    await sendExpoPush({
      to: expoToken!,
      sound: 'default',
      title: bi(titleFr, titleEn),
      body: bi(msgFr, msgEn),
      data,
      priority: 'high',
    });
  }

  private isValidSlotInPlanning(
    planning: any,
    targetHour: string,
    consultationDuration: number
  ): boolean {
    const startMin = toMinutes(planning.debutHour);
    const endMin = toMinutes(planning.endHour);
    const targetMin = toMinutes(targetHour);
    const step = consultationDuration + PAUSE_MINUTES;

    for (let slotStart = startMin; slotStart + consultationDuration <= endMin; slotStart += step) {
      if (slotStart === targetMin) {
        return true;
      }
    }
    return false;
  }

  private generateAvailableSlots(planning: any, duration: number): string[] {
    const slots: string[] = [];
    const startMin = toMinutes(planning.debutHour);
    const endMin = toMinutes(planning.endHour);
    const step = duration + PAUSE_MINUTES;

    for (let m = startMin; m + duration <= endMin; m += step) {
      const h = Math.floor(m / 60);
      const min = m % 60;
      slots.push(`${h.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`);
    }
    return slots;
  }

  private canStartConsultation(reservation: any): { canStart: boolean; message?: string; messageE?: string } {
    const now = new Date();
    const startDateTime = new Date(`${reservation.date}T${reservation.hour}:00`);
    const twoMinutesBefore = new Date(startDateTime.getTime() - 2 * 60 * 1000);

    if (now < twoMinutesBefore) {
      const minutesToWait = Math.ceil((twoMinutesBefore.getTime() - now.getTime()) / (60 * 1000));
      return {
        canStart: false,
        message: `La consultation ne peut pas encore commencer. Elle est prévue à ${reservation.hour}. Vous pouvez commencer 2 minutes avant l'heure prévue (dans ${minutesToWait} minute(s)).`,
        messageE: `Consultation cannot start yet. It is scheduled for ${reservation.hour}. You can start 2 minutes before the scheduled time (in ${minutesToWait} minute(s)).`,
      };
    }

    return { canStart: true };
  }

  private canCompleteConsultation(reservation: any, duration: number): { canComplete: boolean; message?: string; messageE?: string } {
    const now = new Date();
    const startDateTime = new Date(`${reservation.date}T${reservation.hour}:00`);
    const endDateTime = new Date(startDateTime.getTime() + duration * 60 * 1000);
    const fiveMinutesBeforeEnd = new Date(endDateTime.getTime() - 5 * 60 * 1000);

    if (now < fiveMinutesBeforeEnd) {
      const minutesToWait = Math.ceil((fiveMinutesBeforeEnd.getTime() - now.getTime()) / (60 * 1000));
      return {
        canComplete: false,
        message: `La consultation ne peut pas encore être terminée. La fin prévue est à ${addMinutesToHourString(reservation.hour, duration)}. Vous pouvez terminer 5 minutes avant la fin (dans ${minutesToWait} minute(s)).`,
        messageE: `Consultation cannot be completed yet. The scheduled end time is ${addMinutesToHourString(reservation.hour, duration)}. You can complete 5 minutes before the end (in ${minutesToWait} minute(s)).`,
      };
    }

    return { canComplete: true };
  }

  // async create(dto: CreateReservationDto) {
  //   const hourForDisplay = toDisplayHour(dto.hour);

  //   const dateTime = new Date(`${dto.date}T${hourForDisplay}:00`);
  //   if (isNaN(dateTime.getTime())) {
  //     throw new BadRequestException({
  //       message: 'Format de date/heure invalide',
  //       messageE: 'Invalid date/time format',
  //     });
  //   }

  //   const now = new Date();
  //   if (dateTime.getTime() <= now.getTime()) {
  //     throw new BadRequestException({
  //       message: 'La date/heure doit être dans le futur',
  //       messageE: 'Date/time must be in the future',
  //     });
  //   }

  //   if (dateTime.getTime() < now.getTime() + 6 * 60 * 60 * 1000) {
  //     throw new BadRequestException({
  //       message: 'La réservation doit être faite au moins 6h à l\'avance',
  //       messageE: 'Reservation must be made at least 6h in advance',
  //     });
  //   }

  //   const medecin = await this.prisma.user.findUnique({
  //     where: { userId: dto.medecinId },
  //     include: { speciality: true },
  //   });

  //   if (!medecin || medecin.userType !== UserType.MEDECIN) {
  //     throw new NotFoundException({
  //       message: `Médecin d'ID ${dto.medecinId} introuvable`,
  //       messageE: `Doctor with ID ${dto.medecinId} not found`,
  //     });
  //   }

  //   const patient = await this.prisma.user.findUnique({
  //     where: { userId: dto.patientId },
  //   });

  //   if (!patient || patient.userType !== UserType.PATIENT) {
  //     throw new NotFoundException({
  //       message: `Patient d'ID ${dto.patientId} introuvable`,
  //       messageE: `Patient with ID ${dto.patientId} not found`,
  //     });
  //   }

  //   const speciality = await this.prisma.speciality.findUnique({
  //     where: { specialityId: dto.specialityId },
  //   });

  //   if (!speciality) {
  //     throw new NotFoundException({
  //       message: `Spécialité ${dto.specialityId} introuvable`,
  //       messageE: `Speciality ${dto.specialityId} not found`,
  //     });
  //   }

  //   if (medecin.specialityId !== dto.specialityId) {
  //     throw new BadRequestException({
  //       message: 'La spécialité ne correspond pas au médecin',
  //       messageE: 'Speciality does not match the doctor',
  //     });
  //   }

  //   const jours = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  //   const jour = jours[dateTime.getDay()];

  //   let planning: any = null;
  //   let duration: number;
  //   let consultationPrice: number;

  //   if (dto.type === 'CALL') {
  //     planning = await this.prisma.planning.findFirst({
  //       where: {
  //         medecinId: dto.medecinId,
  //         jour,
  //         type: PlanningType.ONLINE,
  //         isActive: true,
  //         isOff: false,
  //       },
  //     });

  //     if (!planning) {
  //       throw new BadRequestException({
  //         message: `Aucun créneau de consultation en ligne trouvé pour le ${jour}`,
  //         messageE: `No online consultation slot found for ${jour}`,
  //       });
  //     }

  //     duration = speciality.consultationDuration;
  //     consultationPrice = Number(speciality.consultationPrice);

  //     const isValid = this.isValidSlotInPlanning(planning, hourForDisplay, duration);
  //     if (!isValid) {
  //       throw new BadRequestException({
  //         message: `L'heure ${hourForDisplay} n'est pas un créneau valide. Les créneaux sont espacés de ${duration + PAUSE_MINUTES} minutes.`,
  //         messageE: `${hourForDisplay} is not a valid slot. Slots are spaced ${duration + PAUSE_MINUTES} minutes apart.`,
  //         availableSlots: this.generateAvailableSlots(planning, duration),
  //       });
  //     }
  //   } else {
  //     if (!dto.hopitalId) {
  //       throw new BadRequestException({
  //         message: 'L\'ID de l\'hôpital est requis pour une réservation en présentiel',
  //         messageE: 'Hospital ID is required for in-person reservation',
  //       });
  //     }

  //     const hopitalAffiliation = await this.prisma.medecinHopital.findFirst({
  //       where: {
  //         medecinId: dto.medecinId,
  //         hopitalId: dto.hopitalId,
  //       },
  //     });

  //     if (!hopitalAffiliation) {
  //       throw new BadRequestException({
  //         message: 'Ce médecin n\'exerce pas dans cet hôpital',
  //         messageE: 'This doctor does not work at this hospital',
  //       });
  //     }

  //     planning = await this.prisma.planning.findFirst({
  //       where: {
  //         medecinId: dto.medecinId,
  //         hopitalId: dto.hopitalId,
  //         jour,
  //         type: PlanningType.IN_PERSON,
  //         isActive: true,
  //         isOff: false,
  //       },
  //     });

  //     if (!planning) {
  //       throw new BadRequestException({
  //         message: `Aucun créneau de consultation en présentiel trouvé pour le ${jour} dans cet hôpital`,
  //         messageE: `No in-person consultation slot found for ${jour} at this hospital`,
  //       });
  //     }

  //     duration = planning.consultationDuration || speciality.consultationDuration;
  //     consultationPrice = Number(planning.consultationPrice || speciality.consultationPrice);

  //     const isValid = this.isValidSlotInPlanning(planning, hourForDisplay, duration);
  //     if (!isValid) {
  //       throw new BadRequestException({
  //         message: `L'heure ${hourForDisplay} n'est pas un créneau valide. Les créneaux sont espacés de ${duration + PAUSE_MINUTES} minutes.`,
  //         messageE: `${hourForDisplay} is not a valid slot. Slots are spaced ${duration + PAUSE_MINUTES} minutes apart.`,
  //         availableSlots: this.generateAvailableSlots(planning, duration),
  //       });
  //     }
  //   }

  //   const startMin = toMinutes(hourForDisplay);
  //   const endMin = startMin + duration;

  //   const existingReservations = await this.prisma.reservation.findMany({
  //     where: {
  //       medecinId: dto.medecinId,
  //       date: dto.date,
  //       status: { in: [ReservationStatus.PENDING, ReservationStatus.STARTED, ReservationStatus.COMPLETED] },
  //     },
  //   });

  //   for (const r of existingReservations) {
  //     const rStart = toMinutes(r.hour);
  //     const rEnd = rStart + duration;
  //     if (startMin < rEnd && endMin > rStart) {
  //       throw new BadRequestException({
  //         message: `Chevauchement avec une autre réservation (${r.hour} - ${addMinutesToHourString(r.hour, duration)})`,
  //         messageE: `Overlaps another reservation (${r.hour} - ${addMinutesToHourString(r.hour, duration)})`,
  //       });
  //     }
  //   }

  //   if (dto.type === 'CALL') {
  //     return this.handleCallReservation(
  //       dto,
  //       medecin,
  //       patient,
  //       speciality,
  //       duration,
  //       consultationPrice,
  //       hourForDisplay,
  //     );
  //   } else {
  //     return this.handleInPersonReservation(
  //       dto,
  //       medecin,
  //       patient,
  //       speciality,
  //       duration,
  //       consultationPrice,
  //       hourForDisplay,
  //     );
  //   }
  // }

  async create(dto: CreateReservationDto) {
  const hourForDisplay = toDisplayHour(dto.hour);

  // ============================================================
  // LIMITER LES RÉSERVATIONS À 7 JOURS MAXIMUM
  // ============================================================

  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dto.date);

  if (!dateMatch) {
    throw new BadRequestException({
      statusCode: 400,
      code: 'INVALID_RESERVATION_DATE_FORMAT',
      message:
        'Le format de la date est invalide. Le format attendu est YYYY-MM-DD.',
      messageE:
        'Invalid date format. Expected format is YYYY-MM-DD.',
    });
  }

  const requestedYear = Number(dateMatch[1]);
  const requestedMonth = Number(dateMatch[2]);
  const requestedDay = Number(dateMatch[3]);

  const requestedDate = new Date(
    Date.UTC(
      requestedYear,
      requestedMonth - 1,
      requestedDay,
      0,
      0,
      0,
    ),
  );

  const isValidRequestedDate =
    requestedDate.getUTCFullYear() === requestedYear &&
    requestedDate.getUTCMonth() === requestedMonth - 1 &&
    requestedDate.getUTCDate() === requestedDay;

  if (!isValidRequestedDate) {
    throw new BadRequestException({
      statusCode: 400,
      code: 'INVALID_RESERVATION_DATE',
      message: `La date "${dto.date}" n'est pas valide.`,
      messageE: `The date "${dto.date}" is invalid.`,
    });
  }

  const today = dateAtLocalMidnight('Africa/Douala');

  const maximumReservationDate = new Date(today);
  maximumReservationDate.setUTCDate(
    maximumReservationDate.getUTCDate() + 7,
  );

  if (requestedDate.getTime() > maximumReservationDate.getTime()) {
    const maximumDateString =
      maximumReservationDate.toISOString().split('T')[0];

    throw new BadRequestException({
      statusCode: 400,
      code: 'RESERVATION_DATE_TOO_FAR',
      message:
        `Vous ne pouvez pas effectuer une réservation plus de 7 jours à l'avance. ` +
        `La dernière date autorisée est le ${maximumDateString} inclus.`,
      messageE:
        `You cannot make a reservation more than 7 days in advance. ` +
        `The latest allowed date is ${maximumDateString}, inclusive.`,
      maximumDate: maximumDateString,
      requestedDate: dto.date,
    });
  }

  const dateTime = new Date(`${dto.date}T${hourForDisplay}:00`);

  if (isNaN(dateTime.getTime())) {
    throw new BadRequestException({
      message: 'Format de date/heure invalide',
      messageE: 'Invalid date/time format',
    });
  }

  const now = new Date();

  if (dateTime.getTime() <= now.getTime()) {
    throw new BadRequestException({
      message: 'La date/heure doit être dans le futur',
      messageE: 'Date/time must be in the future',
    });
  }

  // if (
  //   dateTime.getTime() <
  //   now.getTime() + 6 * 60 * 60 * 1000
  // ) {
  //   throw new BadRequestException({
  //     message:
  //       "La réservation doit être faite au moins 6h à l'avance",
  //     messageE:
  //       'Reservation must be made at least 6h in advance',
  //   });
  // }

  const medecin = await this.prisma.user.findUnique({
    where: {
      userId: dto.medecinId,
    },
    include: {
      speciality: true,
    },
  });

  if (!medecin || medecin.userType !== UserType.MEDECIN) {
    throw new NotFoundException({
      message: `Médecin d'ID ${dto.medecinId} introuvable`,
      messageE: `Doctor with ID ${dto.medecinId} not found`,
    });
  }

  const patient = await this.prisma.user.findUnique({
    where: {
      userId: dto.patientId,
    },
  });

  if (!patient || patient.userType !== UserType.PATIENT) {
    throw new NotFoundException({
      message: `Patient d'ID ${dto.patientId} introuvable`,
      messageE: `Patient with ID ${dto.patientId} not found`,
    });
  }

  const speciality = await this.prisma.speciality.findUnique({
    where: {
      specialityId: dto.specialityId,
    },
  });

  if (!speciality) {
    throw new NotFoundException({
      message: `Spécialité ${dto.specialityId} introuvable`,
      messageE: `Speciality ${dto.specialityId} not found`,
    });
  }

  if (medecin.specialityId !== dto.specialityId) {
    throw new BadRequestException({
      message: 'La spécialité ne correspond pas au médecin',
      messageE: 'Speciality does not match the doctor',
    });
  }

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

  let planning: any = null;
  let duration: number;
  let consultationPrice: number;

  if (dto.type === 'CALL') {
    planning = await this.prisma.planning.findFirst({
      where: {
        medecinId: dto.medecinId,
        jour,
        type: PlanningType.ONLINE,
        isActive: true,
        isOff: false,
      },
    });

    if (!planning) {
      throw new BadRequestException({
        message:
          `Aucun créneau de consultation en ligne trouvé pour le ${jour}`,
        messageE:
          `No online consultation slot found for ${jour}`,
      });
    }

    duration = speciality.consultationDuration;
    consultationPrice = Number(
      speciality.consultationPrice,
    );

    const isValid = this.isValidSlotInPlanning(
      planning,
      hourForDisplay,
      duration,
    );

    if (!isValid) {
      throw new BadRequestException({
        message:
          `L'heure ${hourForDisplay} n'est pas un créneau valide. ` +
          `Les créneaux sont espacés de ${duration + PAUSE_MINUTES} minutes.`,
        messageE:
          `${hourForDisplay} is not a valid slot. ` +
          `Slots are spaced ${duration + PAUSE_MINUTES} minutes apart.`,
        availableSlots: this.generateAvailableSlots(
          planning,
          duration,
        ),
      });
    }
  } else {
    if (!dto.hopitalId) {
      throw new BadRequestException({
        message:
          "L'ID de l'hôpital est requis pour une réservation en présentiel",
        messageE:
          'Hospital ID is required for in-person reservation',
      });
    }

    const hopitalAffiliation =
      await this.prisma.medecinHopital.findFirst({
        where: {
          medecinId: dto.medecinId,
          hopitalId: dto.hopitalId,
        },
      });

    if (!hopitalAffiliation) {
      throw new BadRequestException({
        message:
          "Ce médecin n'exerce pas dans cet hôpital",
        messageE:
          'This doctor does not work at this hospital',
      });
    }

    planning = await this.prisma.planning.findFirst({
      where: {
        medecinId: dto.medecinId,
        hopitalId: dto.hopitalId,
        jour,
        type: PlanningType.IN_PERSON,
        isActive: true,
        isOff: false,
      },
    });

    if (!planning) {
      throw new BadRequestException({
        message:
          `Aucun créneau de consultation en présentiel trouvé ` +
          `pour le ${jour} dans cet hôpital`,
        messageE:
          `No in-person consultation slot found for ${jour} ` +
          `at this hospital`,
      });
    }

    duration =
      planning.consultationDuration ||
      speciality.consultationDuration;

    consultationPrice = Number(
      planning.consultationPrice ||
      speciality.consultationPrice,
    );

    const isValid = this.isValidSlotInPlanning(
      planning,
      hourForDisplay,
      duration,
    );

    if (!isValid) {
      throw new BadRequestException({
        message:
          `L'heure ${hourForDisplay} n'est pas un créneau valide. ` +
          `Les créneaux sont espacés de ${duration + PAUSE_MINUTES} minutes.`,
        messageE:
          `${hourForDisplay} is not a valid slot. ` +
          `Slots are spaced ${duration + PAUSE_MINUTES} minutes apart.`,
        availableSlots: this.generateAvailableSlots(
          planning,
          duration,
        ),
      });
    }
  }

  const startMin = toMinutes(hourForDisplay);
  const endMin = startMin + duration;

  const existingReservations =
    await this.prisma.reservation.findMany({
      where: {
        medecinId: dto.medecinId,
        date: dto.date,
        status: {
          in: [
            ReservationStatus.PENDING,
            ReservationStatus.STARTED,
            ReservationStatus.COMPLETED,
          ],
        },
      },
    });

  for (const reservation of existingReservations) {
    const reservationStart = toMinutes(reservation.hour);
    const reservationEnd = reservationStart + duration;

    if (
      startMin < reservationEnd &&
      endMin > reservationStart
    ) {
      throw new BadRequestException({
        message:
          `Chevauchement avec une autre réservation ` +
          `(${reservation.hour} - ${addMinutesToHourString(
            reservation.hour,
            duration,
          )})`,
        messageE:
          `Overlaps another reservation ` +
          `(${reservation.hour} - ${addMinutesToHourString(
            reservation.hour,
            duration,
          )})`,
      });
    }
  }

  if (dto.type === 'CALL') {
    return this.handleCallReservation(
      dto,
      medecin,
      patient,
      speciality,
      duration,
      consultationPrice,
      hourForDisplay,
    );
  }

  return this.handleInPersonReservation(
    dto,
    medecin,
    patient,
    speciality,
    duration,
    consultationPrice,
    hourForDisplay,
  );
}



  private async handleCallReservation(
    dto: CreateReservationDto,
    medecin: any,
    patient: any,
    speciality: any,
    duration: number,
    consultationPrice: number,
    hourForDisplay: string,
  ) {
    const today = dateAtLocalMidnight('Africa/Douala');
    const todayTime = today.getTime();

    // ============================================================
    // Un patient peut avoir PLUSIEURS abonnements pour la même
    // spécialité. On parcourt chaque abonnement (du plus ancien au
    // plus récent) et on prend le premier encore UTILISABLE :
    //   - non expiré (endDate >= aujourd'hui)
    //   - nombre de réservations pas encore épuisé
    // Si l'abonnement est épuisé ou expiré, on passe au suivant.
    // ============================================================

    const subscriptions = await this.prisma.abonnement.findMany({
      where: {
        patientId: dto.patientId,
        status: AbonnementStatus.CONFIRMED,
        package: {
          specialityId: dto.specialityId,
        },
      },
      include: { package: true },
      orderBy: [{ createdAt: 'asc' }, { abonnementId: 'asc' }],
    });

    if (subscriptions.length === 0) {
      throw new BadRequestException({
        message: 'Vous n\'avez pas d\'abonnement actif pour cette spécialité',
        messageE: 'You have no active subscription for this speciality',
        requiredAction: 'SUBSCRIBE',
      });
    }

    let activeSubscription: (typeof subscriptions)[number] | null = null;
    let remainingBefore = 0;

    for (const subscription of subscriptions) {
      // Abonnement expiré => on passe au suivant
      if (new Date(subscription.endDate).getTime() < todayTime) {
        continue;
      }

      // Vérité d'utilisation : toute réservation attachée à l'abonnement
      // compte, quel que soit son type ou son statut.
      const usedCount = await this.prisma.reservation.count({
        where: {
          abonnementId: subscription.abonnementId,
        },
      });

      // remainingReservations est le compteur atomique décrémenté dans la
      // même transaction que la création de la réservation (verrou contre
      // les réservations simultanées). usedCount sert de garde
      // anti-désynchronisation : on ne consomme jamais plus que le quota
      // total du package.
      const remaining = Math.min(
        subscription.remainingReservations,
        Math.max(0, (subscription.numberOfTimePlanReservation || 0) - usedCount),
      );

      // Abonnement dont le quota de réservations est épuisé => on passe au suivant
      if (remaining <= 0) {
        continue;
      }

      activeSubscription = subscription;
      remainingBefore = remaining;
      break;
    }

    if (!activeSubscription) {
      const hasNotExpired = subscriptions.some(
        (s) => new Date(s.endDate).getTime() >= todayTime,
      );

      if (!hasNotExpired) {
        throw new BadRequestException({
          message: 'Vos abonnements pour cette spécialité sont expirés',
          messageE: 'Your subscriptions for this speciality have expired',
          requiredAction: 'SUBSCRIBE',
        });
      }

      throw new BadRequestException({
        message: 'Vous avez atteint le quota de consultations de vos abonnements pour cette spécialité',
        messageE: 'You have reached the consultation quota of your subscriptions for this speciality',
        requiredAction: 'RENEW_SUBSCRIPTION',
      });
    }

    const reservation = await this.prisma.$transaction(async (tx) => {
      const decremented = await tx.abonnement.updateMany({
        where: {
          abonnementId: activeSubscription.abonnementId,
          remainingReservations: { gte: 1 },
        },
        data: {
          remainingReservations: { decrement: 1 },
        },
      });

      if (decremented.count === 0) {
        throw new BadRequestException({
          message: 'Vous avez atteint le quota de consultations de votre abonnement',
          messageE: 'You have reached your subscription consultation quota',
          requiredAction: 'RENEW_SUBSCRIPTION',
        });
      }

      return tx.reservation.create({
        data: {
          date: dto.date,
          hour: hourForDisplay,
          type: dto.type,
          patientName: dto.patientName,
          sex: dto.sex,
          age: dto.age,
          description: dto.description,
          medecinId: dto.medecinId,
          patientId: dto.patientId,
          location: dto.location || null,
          amount: 0,
          abonnementId: activeSubscription.abonnementId,
          status: ReservationStatus.PENDING,
        },
      });
    });

    const titlePatientFr = 'Réservation confirmée';
    const titlePatientEn = 'Reservation confirmed';
    const msgPatientFr = `Votre réservation avec Dr ${medecin.firstName} ${medecin.lastName} a été confirmée pour le ${dto.date} à ${hourForDisplay}.`;
    const msgPatientEn = `Your reservation with Dr ${medecin.firstName} ${medecin.lastName} has been confirmed for ${dto.date} at ${hourForDisplay}.`;

    const titleDoctorFr = 'Nouvelle réservation';
    const titleDoctorEn = 'New reservation';
    const msgDoctorFr = `${patient.firstName} ${patient.lastName} a réservé une consultation en ligne pour le ${dto.date} à ${hourForDisplay}.`;
    const msgDoctorEn = `${patient.firstName} ${patient.lastName} booked an online consultation for ${dto.date} at ${hourForDisplay}.`;

    void this.createNotification(
      patient.userId,
      titlePatientFr,
      titlePatientEn,
      msgPatientFr,
      msgPatientEn,
    ).catch(() => void 0);

    void this.createNotification(
      medecin.userId,
      titleDoctorFr,
      titleDoctorEn,
      msgDoctorFr,
      msgDoctorEn,
    ).catch(() => void 0);

    void this.pushIfPossible(
      patient.expotoken,
      titlePatientFr,
      titlePatientEn,
      msgPatientFr,
      msgPatientEn,
      {
        kind: 'RESERVATION_CONFIRMED',
        reservationId: reservation.reservationId,
        type: reservation.type,
      },
    ).catch(() => void 0);

    void this.pushIfPossible(
      medecin.expotoken,
      titleDoctorFr,
      titleDoctorEn,
      msgDoctorFr,
      msgDoctorEn,
      {
        kind: 'RESERVATION_NEW',
        reservationId: reservation.reservationId,
        patientId: patient.userId,
        type: reservation.type,
      },
    ).catch(() => void 0);

    return {
      success: true,
      message: 'Réservation créée avec succès (abonnement utilisé)',
      messageE: 'Reservation created successfully (subscription used)',
      reservation: {
        ...reservation,
        usedSubscription: true,
        consultationsRestantes: remainingBefore - 1,
        consultationPrice,
        duration,
        startHour: hourForDisplay,
        endHour: addMinutesToHourString(hourForDisplay, duration),
      },
    };
  }

  private async handleInPersonReservation(
    dto: CreateReservationDto,
    medecin: any,
    patient: any,
    speciality: any,
    duration: number,
    consultationPrice: number,
    hourForDisplay: string,
  ) {
    const hopital = await this.prisma.user.findUnique({
      where: { userId: dto.hopitalId, userType: UserType.HOPITAL },
    });

    if (!hopital) {
      throw new NotFoundException({
        message: `Hôpital d'ID ${dto.hopitalId} introuvable`,
        messageE: `Hospital with ID ${dto.hopitalId} not found`,
      });
    }

    const reservation = await this.prisma.reservation.create({
      data: {
        date: dto.date,
        hour: hourForDisplay,
        type: dto.type,
        patientName: dto.patientName,
        sex: dto.sex,
        age: dto.age,
        description: dto.description,
        medecinId: dto.medecinId,
        patientId: dto.patientId,
        location: dto.location || null,
        hopitalId: dto.hopitalId,
        amount: consultationPrice,
        status: ReservationStatus.PENDING,
      },
    });

    const hopitalLabel = hopital.hospitalName || hopital.firstName;

    const titlePatientFr = 'Réservation confirmée';
    const titlePatientEn = 'Reservation confirmed';
    const msgPatientFr = `Votre réservation en présentiel avec Dr ${medecin.firstName} ${medecin.lastName} à "${hopitalLabel}" a été confirmée pour le ${dto.date} à ${hourForDisplay}.`;
    const msgPatientEn = `Your in-person reservation with Dr ${medecin.firstName} ${medecin.lastName} at "${hopitalLabel}" has been confirmed for ${dto.date} at ${hourForDisplay}.`;

    const titleDoctorFr = 'Nouvelle réservation en présentiel';
    const titleDoctorEn = 'New in-person reservation';
    const msgDoctorFr = `${patient.firstName} ${patient.lastName} a réservé une consultation en présentiel à "${hopitalLabel}" pour le ${dto.date} à ${hourForDisplay}.`;
    const msgDoctorEn = `${patient.firstName} ${patient.lastName} booked an in-person consultation at "${hopitalLabel}" for ${dto.date} at ${hourForDisplay}.`;

    const titleHopitalFr = 'Nouvelle réservation hôpital';
    const titleHopitalEn = 'New hospital reservation';
    const msgHopitalFr = `Une réservation en présentiel a été créée pour Dr ${medecin.firstName} ${medecin.lastName} le ${dto.date} à ${hourForDisplay}.`;
    const msgHopitalEn = `A new in-person reservation has been created for Dr ${medecin.firstName} ${medecin.lastName} on ${dto.date} at ${hourForDisplay}.`;

    void this.createNotification(
      patient.userId,
      titlePatientFr,
      titlePatientEn,
      msgPatientFr,
      msgPatientEn,
    ).catch(() => void 0);

    void this.createNotification(
      medecin.userId,
      titleDoctorFr,
      titleDoctorEn,
      msgDoctorFr,
      msgDoctorEn,
    ).catch(() => void 0);

    void this.createNotification(
      hopital.userId,
      titleHopitalFr,
      titleHopitalEn,
      msgHopitalFr,
      msgHopitalEn,
    ).catch(() => void 0);

    void this.pushIfPossible(
      patient.expotoken,
      titlePatientFr,
      titlePatientEn,
      msgPatientFr,
      msgPatientEn,
      {
        kind: 'RESERVATION_CONFIRMED',
        reservationId: reservation.reservationId,
        type: reservation.type,
        hopitalId: hopital.userId,
      },
    ).catch(() => void 0);

    void this.pushIfPossible(
      medecin.expotoken,
      titleDoctorFr,
      titleDoctorEn,
      msgDoctorFr,
      msgDoctorEn,
      {
        kind: 'RESERVATION_NEW',
        reservationId: reservation.reservationId,
        patientId: patient.userId,
        hopitalId: hopital.userId,
        type: reservation.type,
      },
    ).catch(() => void 0);

    void this.pushIfPossible(
      hopital.expotoken,
      titleHopitalFr,
      titleHopitalEn,
      msgHopitalFr,
      msgHopitalEn,
      {
        kind: 'RESERVATION_HOSPITAL_NEW',
        reservationId: reservation.reservationId,
        medecinId: medecin.userId,
        patientId: patient.userId,
      },
    ).catch(() => void 0);

    return {
      success: true,
      message: 'Réservation créée avec succès',
      messageE: 'Reservation created successfully',
      reservation: {
        ...reservation,
        usedSubscription: false,
        consultationPrice,
        duration,
        startHour: hourForDisplay,
        endHour: addMinutesToHourString(hourForDisplay, duration),
      },
    };
  }

  async startConsultation(id: number, userId: number) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { reservationId: id },
      include: {
        medecin: true,
        patient: true,
      },
    });

    if (!reservation) {
      throw new NotFoundException({
        message: `Réservation ${id} introuvable`,
        messageE: `Reservation ${id} not found`,
      });
    }

    // if (reservation.medecinId !== userId) {
    //   throw new ForbiddenException({
    //     message: 'Vous n\'êtes pas autorisé à démarrer cette consultation',
    //     messageE: 'You are not authorized to start this consultation',
    //   });
    // }

    if (reservation.status !== ReservationStatus.PENDING) {
      throw new BadRequestException({
        message: `Impossible de démarrer une consultation au statut '${reservation.status}'`,
        messageE: `Cannot start a consultation with status '${reservation.status}'`,
      });
    }

    const medecin = await this.prisma.user.findUnique({
      where: { userId: reservation.medecinId },
      include: { speciality: true },
    });

    const duration = medecin?.speciality?.consultationDuration || 30;

    const startCheck = this.canStartConsultation(reservation);
    if (!startCheck.canStart) {
      throw new BadRequestException({
        message: startCheck.message,
        messageE: startCheck.messageE,
      });
    }

    const updated = await this.prisma.reservation.update({
      where: { reservationId: id },
      data: { status: ReservationStatus.STARTED },
    });

    const titleFr = 'Consultation démarrée';
    const titleEn = 'Consultation started';
    const msgFr = `Votre consultation prévue le ${reservation.date} à ${reservation.hour} a démarré.`;
    const msgEn = `Your consultation scheduled on ${reservation.date} at ${reservation.hour} has started.`;

    void this.createNotification(
      reservation.patientId,
      titleFr,
      titleEn,
      msgFr,
      msgEn,
    ).catch(() => void 0);

    void this.pushIfPossible(
      reservation.patient?.expotoken,
      titleFr,
      titleEn,
      msgFr,
      msgEn,
      {
        kind: 'RESERVATION_STARTED',
        reservationId: updated.reservationId,
      },
    ).catch(() => void 0);

    return {
      success: true,
      message: 'Consultation démarrée avec succès',
      messageE: 'Consultation started successfully',
      reservation: updated,
    };
  }
private async creditEncryptedSolde(
  ownerId: number,
  amountToCredit: number,
): Promise<number> {
  const soldeRow = await this.prisma.soldeMedecin.findFirst({
    where: { medecinId: ownerId },
  });

  if (soldeRow) {
    const result = addToEncryptedBalance(soldeRow.solde, amountToCredit);

    await this.prisma.soldeMedecin.update({
      where: { soldeMedecinId: soldeRow.soldeMedecinId },
      data: { solde: result.encrypted },
    });

    return result.balance;
  }

  const encrypted = encryptBalance(amountToCredit);

  await this.prisma.soldeMedecin.create({
    data: {
      medecinId: ownerId,
      solde: encrypted,
    },
  });

  return amountToCredit;
}
async completeConsultation(id: number, userId: number) {
  const reservation = await this.prisma.reservation.findUnique({
    where: { reservationId: id },
    include: {
      medecin: { include: { speciality: true } },
      hopital: true,
      patient: true,
    },
  });

  if (!reservation) {
    throw new NotFoundException({
      message: `Réservation ${id} introuvable`,
      messageE: `Reservation ${id} not found`,
    });
  }

  // if (reservation.medecinId !== userId) {
  //   throw new ForbiddenException({
  //     message: "Vous n'êtes pas autorisé à terminer cette consultation",
  //     messageE: 'You are not authorized to complete this consultation',
  //   });
  // }

  if (
    reservation.status !== ReservationStatus.STARTED &&
    reservation.status !== ReservationStatus.PENDING
  ) {
    throw new BadRequestException({
      message: `Impossible de terminer une consultation au statut '${reservation.status}'`,
      messageE: `Cannot complete a consultation with status '${reservation.status}'`,
    });
  }

  const duration =
    reservation.medecin?.speciality?.consultationDuration || 30;

  if (reservation.status === ReservationStatus.PENDING) {
    const completeCheck = this.canCompleteConsultation(
      reservation,
      duration,
    );

    if (!completeCheck.canComplete) {
      throw new BadRequestException({
        message: completeCheck.message,
        messageE: completeCheck.messageE,
      });
    }
  }

  const settings = await this.prisma.setting.findFirst();

  let amountToCredit = 0;
  let platformCommission = 0;
  let creditTo = '';
  let nouveauSolde = 0;

  if (reservation.type === 'CALL') {
    const consultationPrice = Number(
      reservation.medecin?.speciality?.consultationPrice || 0,
    );

    if (settings) {
      if (settings.onlineType === 'PERCENTAGE') {
        platformCommission =
          consultationPrice * (settings.onlineValue / 100);
        amountToCredit = consultationPrice - platformCommission;
      } else {
        platformCommission = settings.onlineValue;
        amountToCredit = consultationPrice - platformCommission;
      }
    } else {
      platformCommission = 0;
      amountToCredit = consultationPrice;
    }

    creditTo = `médecin ${reservation.medecin.firstName} ${reservation.medecin.lastName}`;

    nouveauSolde = await this.creditEncryptedSolde(
      reservation.medecinId,
      amountToCredit,
    );
  } else {
    const consultationPrice = Number(reservation.amount || 0);

    if (settings) {
      if (settings.onsiteType === 'PERCENTAGE') {
        platformCommission =
          consultationPrice * (settings.onsiteValue / 100);
        amountToCredit = consultationPrice - platformCommission;
      } else {
        platformCommission = settings.onsiteValue;
        amountToCredit = consultationPrice - platformCommission;
      }
    } else {
      platformCommission = 0;
      amountToCredit = consultationPrice;
    }

    creditTo = `hôpital ${reservation.hopital?.firstName || ''}`;

    if (!reservation.hopitalId) {
      throw new BadRequestException({
        message:
          "Aucun hôpital lié à cette réservation en présentiel.",
        messageE:
          'No hospital is attached to this in-person reservation.',
      });
    }

    nouveauSolde = await this.creditEncryptedSolde(
      reservation.hopitalId,
      amountToCredit,
    );

    if (reservation.transactionId) {
      await this.prisma.transaction.update({
        where: { transactionId: reservation.transactionId },
        data: {
          status: TransactionStatus.PAID,
          paymentId: `TR-RES-${randomUUID()}`,
        },
      });
    }
  }

  const updated = await this.prisma.reservation.update({
    where: { reservationId: id },
    data: { status: ReservationStatus.COMPLETED },
  });

  const titleFr = 'Consultation terminée';
  const titleEn = 'Consultation completed';
  const msgFr = `Votre consultation du ${reservation.date} à ${reservation.hour} est terminée.`;
  const msgEn = `Your consultation on ${reservation.date} at ${reservation.hour} is completed.`;

  void this.createNotification(
    reservation.patientId,
    titleFr,
    titleEn,
    msgFr,
    msgEn,
  ).catch(() => void 0);

  void this.pushIfPossible(
    reservation.patient?.expotoken,
    titleFr,
    titleEn,
    msgFr,
    msgEn,
    {
      kind: 'RESERVATION_COMPLETED',
      reservationId: updated.reservationId,
    },
  ).catch(() => void 0);

  return {
    success: true,
    message: 'Consultation terminée avec succès',
    messageE: 'Consultation completed successfully',
    details: {
      reservationId: id,
      status: ReservationStatus.COMPLETED,
      consultationPrice:
        reservation.type === 'CALL'
          ? Number(
              reservation.medecin?.speciality?.consultationPrice || 0,
            )
          : Number(reservation.amount || 0),
      platformCommission,
      amountCredited: amountToCredit,
      creditedTo: creditTo,
      nouveauSolde,
    },
    reservation: updated,
  };
}

  // async updateDate(id: number, dto: UpdateReservationDateDto) {
  //   const hourForDisplay = toDisplayHour(dto.hour);

  //   const existing = await this.prisma.reservation.findUnique({
  //     where: { reservationId: id },
  //     include: {
  //       medecin: { include: { speciality: true } },
  //       hopital: true,
  //       patient: true,
  //     },
  //   });

  //   if (!existing) {
  //     throw new NotFoundException({
  //       message: `Réservation ${id} introuvable`,
  //       messageE: `Reservation ${id} not found`,
  //     });
  //   }

  //   if (existing.status !== ReservationStatus.PENDING) {
  //     throw new BadRequestException({
  //       message: `Impossible de modifier une réservation ${existing.status}`,
  //       messageE: `Cannot modify a ${existing.status} reservation`,
  //     });
  //   }

  //   const newDateTime = new Date(`${dto.date}T${hourForDisplay}:00`);
  //   const now = new Date();

  //   if (isNaN(newDateTime.getTime()) || newDateTime <= now) {
  //     throw new BadRequestException({
  //       message: 'La date/heure doit être valide et future',
  //       messageE: 'Date/time must be valid and in the future',
  //     });
  //   }

  //   if (newDateTime.getTime() < now.getTime() + 24 * 60 * 60 * 1000) {
  //     throw new BadRequestException({
  //       message: 'La modification doit être faite au moins 24h à l\'avance',
  //       messageE: 'Modification must be made at least 24h in advance',
  //     });
  //   }

  //   const jours = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  //   const jour = jours[newDateTime.getDay()];

  //   let planning: any = null;
  //   let duration: number;

  //   if (existing.type === 'CALL') {
  //     planning = await this.prisma.planning.findFirst({
  //       where: {
  //         medecinId: existing.medecinId,
  //         jour,
  //         type: PlanningType.ONLINE,
  //         isActive: true,
  //         isOff: false,
  //       },
  //     });

  //     if (!planning) {
  //       throw new BadRequestException({
  //         message: `Aucun créneau de consultation en ligne trouvé pour le ${jour}`,
  //         messageE: `No online consultation slot found for ${jour}`,
  //       });
  //     }

  //     duration = existing.medecin.speciality?.consultationDuration || 0;

  //     const isValid = this.isValidSlotInPlanning(planning, hourForDisplay, duration);
  //     if (!isValid) {
  //       throw new BadRequestException({
  //         message: `L'heure ${hourForDisplay} n'est pas un créneau valide`,
  //         messageE: `${hourForDisplay} is not a valid slot`,
  //       });
  //     }
  //   } else {
  //     planning = await this.prisma.planning.findFirst({
  //       where: {
  //         medecinId: existing.medecinId,
  //         hopitalId: existing.hopitalId,
  //         jour,
  //         type: PlanningType.IN_PERSON,
  //         isActive: true,
  //         isOff: false,
  //       },
  //     });

  //     if (!planning) {
  //       throw new BadRequestException({
  //         message: `Aucun créneau de consultation en présentiel trouvé pour le ${jour}`,
  //         messageE: `No in-person consultation slot found for ${jour}`,
  //       });
  //     }

  //     duration = planning.consultationDuration || existing.medecin.speciality?.consultationDuration || 0;

  //     const isValid = this.isValidSlotInPlanning(planning, hourForDisplay, duration);
  //     if (!isValid) {
  //       throw new BadRequestException({
  //         message: `L'heure ${hourForDisplay} n'est pas un créneau valide`,
  //         messageE: `${hourForDisplay} is not a valid slot`,
  //       });
  //     }
  //   }

  //   const startMin = toMinutes(hourForDisplay);
  //   const endMin = startMin + (duration || 0);

  //   const others = await this.prisma.reservation.findMany({
  //     where: {
  //       medecinId: existing.medecinId,
  //       date: dto.date,
  //       reservationId: { not: id },
  //       status: { in: [ReservationStatus.PENDING, ReservationStatus.STARTED, ReservationStatus.COMPLETED] },
  //     },
  //   });

  //   for (const r of others) {
  //     const rStart = toMinutes(r.hour);
  //     const rEnd = rStart + (duration || 0);
  //     if (startMin < rEnd && endMin > rStart) {
  //       throw new BadRequestException({
  //         message: 'Chevauchement avec une autre réservation',
  //         messageE: 'Overlaps another reservation',
  //       });
  //     }
  //   }

  //   const reservation = await this.prisma.reservation.update({
  //     where: { reservationId: id },
  //     data: { date: dto.date, hour: hourForDisplay },
  //   });

  //   const titlePatientFr = 'Réservation modifiée';
  //   const titlePatientEn = 'Reservation updated';
  //   const msgPatientFr = `Votre réservation a été reprogrammée au ${dto.date} à ${hourForDisplay}.`;
  //   const msgPatientEn = `Your reservation has been rescheduled to ${dto.date} at ${hourForDisplay}.`;

  //   const titleDoctorFr = 'Réservation reprogrammée';
  //   const titleDoctorEn = 'Reservation rescheduled';
  //   const msgDoctorFr = `La réservation de ${existing.patient?.firstName || 'un patient'} ${existing.patient?.lastName || ''} a été déplacée au ${dto.date} à ${hourForDisplay}.`;
  //   const msgDoctorEn = `The reservation of ${existing.patient?.firstName || 'a patient'} ${existing.patient?.lastName || ''} has been moved to ${dto.date} at ${hourForDisplay}.`;

  //   void this.createNotification(
  //     existing.patientId,
  //     titlePatientFr,
  //     titlePatientEn,
  //     msgPatientFr,
  //     msgPatientEn,
  //   ).catch(() => void 0);

  //   void this.createNotification(
  //     existing.medecinId,
  //     titleDoctorFr,
  //     titleDoctorEn,
  //     msgDoctorFr,
  //     msgDoctorEn,
  //   ).catch(() => void 0);

  //   void this.pushIfPossible(
  //     existing.patient?.expotoken,
  //     titlePatientFr,
  //     titlePatientEn,
  //     msgPatientFr,
  //     msgPatientEn,
  //     {
  //       kind: 'RESERVATION_RESCHEDULED',
  //       reservationId: reservation.reservationId,
  //     },
  //   ).catch(() => void 0);

  //   void this.pushIfPossible(
  //     existing.medecin?.expotoken,
  //     titleDoctorFr,
  //     titleDoctorEn,
  //     msgDoctorFr,
  //     msgDoctorEn,
  //     {
  //       kind: 'RESERVATION_RESCHEDULED_DOCTOR',
  //       reservationId: reservation.reservationId,
  //     },
  //   ).catch(() => void 0);

  //   return {
  //     success: true,
  //     message: 'Date modifiée avec succès',
  //     messageE: 'Date updated successfully',
  //     reservation,
  //   };
  // }

  async updateDate(
  id: number,
  dto: UpdateReservationDateDto,
) {
  const hourForDisplay = toDisplayHour(dto.hour);

  const existing =
    await this.prisma.reservation.findUnique({
      where: {
        reservationId: id,
      },
      include: {
        medecin: {
          include: {
            speciality: true,
          },
        },
        hopital: true,
        patient: true,
      },
    });

  if (!existing) {
    throw new NotFoundException({
      message: `Réservation ${id} introuvable`,
      messageE: `Reservation ${id} not found`,
    });
  }

  if (existing.status !== ReservationStatus.PENDING) {
    throw new BadRequestException({
      message:
        `Impossible de modifier une réservation ${existing.status}`,
      messageE:
        `Cannot modify a ${existing.status} reservation`,
    });
  }

  // ============================================================
  // LIMITER LA NOUVELLE DATE À 7 JOURS MAXIMUM
  // ============================================================

  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dto.date);

  if (!dateMatch) {
    throw new BadRequestException({
      statusCode: 400,
      code: 'INVALID_RESERVATION_DATE_FORMAT',
      message:
        'Le format de la date est invalide. Le format attendu est YYYY-MM-DD.',
      messageE:
        'Invalid date format. Expected format is YYYY-MM-DD.',
    });
  }

  const requestedYear = Number(dateMatch[1]);
  const requestedMonth = Number(dateMatch[2]);
  const requestedDay = Number(dateMatch[3]);

  const requestedDate = new Date(
    Date.UTC(
      requestedYear,
      requestedMonth - 1,
      requestedDay,
      0,
      0,
      0,
    ),
  );

  const isValidRequestedDate =
    requestedDate.getUTCFullYear() === requestedYear &&
    requestedDate.getUTCMonth() === requestedMonth - 1 &&
    requestedDate.getUTCDate() === requestedDay;

  if (!isValidRequestedDate) {
    throw new BadRequestException({
      statusCode: 400,
      code: 'INVALID_RESERVATION_DATE',
      message: `La date "${dto.date}" n'est pas valide.`,
      messageE: `The date "${dto.date}" is invalid.`,
    });
  }

  const today = dateAtLocalMidnight('Africa/Douala');

  const maximumReservationDate = new Date(today);
  maximumReservationDate.setUTCDate(
    maximumReservationDate.getUTCDate() + 7,
  );

  if (requestedDate.getTime() > maximumReservationDate.getTime()) {
    const maximumDateString =
      maximumReservationDate.toISOString().split('T')[0];

    throw new BadRequestException({
      statusCode: 400,
      code: 'RESERVATION_DATE_TOO_FAR',
      message:
        `Vous ne pouvez pas déplacer une réservation à plus de 7 jours. ` +
        `La dernière date autorisée est le ${maximumDateString} inclus.`,
      messageE:
        `You cannot move a reservation more than 7 days ahead. ` +
        `The latest allowed date is ${maximumDateString}, inclusive.`,
      maximumDate: maximumDateString,
      requestedDate: dto.date,
    });
  }

  const newDateTime = new Date(
    `${dto.date}T${hourForDisplay}:00`,
  );

  const now = new Date();

  if (
    isNaN(newDateTime.getTime()) ||
    newDateTime <= now
  ) {
    throw new BadRequestException({
      message:
        'La date/heure doit être valide et future',
      messageE:
        'Date/time must be valid and in the future',
    });
  }

  if (
    newDateTime.getTime() <
    now.getTime() + 24 * 60 * 60 * 1000
  ) {
    throw new BadRequestException({
      message:
        "La modification doit être faite au moins 24h à l'avance",
      messageE:
        'Modification must be made at least 24h in advance',
    });
  }

  const jours = [
    'dimanche',
    'lundi',
    'mardi',
    'mercredi',
    'jeudi',
    'vendredi',
    'samedi',
  ];

  const jour = jours[newDateTime.getDay()];

  let planning: any = null;
  let duration: number;

  if (existing.type === 'CALL') {
    planning = await this.prisma.planning.findFirst({
      where: {
        medecinId: existing.medecinId,
        jour,
        type: PlanningType.ONLINE,
        isActive: true,
        isOff: false,
      },
    });

    if (!planning) {
      throw new BadRequestException({
        message:
          `Aucun créneau de consultation en ligne trouvé pour le ${jour}`,
        messageE:
          `No online consultation slot found for ${jour}`,
      });
    }

    duration =
      existing.medecin.speciality?.consultationDuration ||
      0;

    const isValid = this.isValidSlotInPlanning(
      planning,
      hourForDisplay,
      duration,
    );

    if (!isValid) {
      throw new BadRequestException({
        message:
          `L'heure ${hourForDisplay} n'est pas un créneau valide`,
        messageE:
          `${hourForDisplay} is not a valid slot`,
        availableSlots: this.generateAvailableSlots(
          planning,
          duration,
        ),
      });
    }
  } else {
    planning = await this.prisma.planning.findFirst({
      where: {
        medecinId: existing.medecinId,
        hopitalId: existing.hopitalId,
        jour,
        type: PlanningType.IN_PERSON,
        isActive: true,
        isOff: false,
      },
    });

    if (!planning) {
      throw new BadRequestException({
        message:
          `Aucun créneau de consultation en présentiel trouvé pour le ${jour}`,
        messageE:
          `No in-person consultation slot found for ${jour}`,
      });
    }

    duration =
      planning.consultationDuration ||
      existing.medecin.speciality?.consultationDuration ||
      0;

    const isValid = this.isValidSlotInPlanning(
      planning,
      hourForDisplay,
      duration,
    );

    if (!isValid) {
      throw new BadRequestException({
        message:
          `L'heure ${hourForDisplay} n'est pas un créneau valide`,
        messageE:
          `${hourForDisplay} is not a valid slot`,
        availableSlots: this.generateAvailableSlots(
          planning,
          duration,
        ),
      });
    }
  }

  const startMin = toMinutes(hourForDisplay);
  const endMin = startMin + duration;

  const otherReservations =
    await this.prisma.reservation.findMany({
      where: {
        medecinId: existing.medecinId,
        date: dto.date,
        reservationId: {
          not: id,
        },
        status: {
          in: [
            ReservationStatus.PENDING,
            ReservationStatus.STARTED,
            ReservationStatus.COMPLETED,
          ],
        },
      },
    });

  for (const reservation of otherReservations) {
    const reservationStart = toMinutes(reservation.hour);
    const reservationEnd = reservationStart + duration;

    if (
      startMin < reservationEnd &&
      endMin > reservationStart
    ) {
      throw new BadRequestException({
        message:
          'Chevauchement avec une autre réservation',
        messageE:
          'Overlaps another reservation',
      });
    }
  }

  const reservation =
    await this.prisma.reservation.update({
      where: {
        reservationId: id,
      },
      data: {
        date: dto.date,
        hour: hourForDisplay,
      },
    });

  const titlePatientFr = 'Réservation modifiée';
  const titlePatientEn = 'Reservation updated';

  const msgPatientFr =
    `Votre réservation a été reprogrammée au ` +
    `${dto.date} à ${hourForDisplay}.`;

  const msgPatientEn =
    `Your reservation has been rescheduled to ` +
    `${dto.date} at ${hourForDisplay}.`;

  const titleDoctorFr = 'Réservation reprogrammée';
  const titleDoctorEn = 'Reservation rescheduled';

  const msgDoctorFr =
    `La réservation de ` +
    `${existing.patient?.firstName || 'un patient'} ` +
    `${existing.patient?.lastName || ''} ` +
    `a été déplacée au ${dto.date} à ${hourForDisplay}.`;

  const msgDoctorEn =
    `The reservation of ` +
    `${existing.patient?.firstName || 'a patient'} ` +
    `${existing.patient?.lastName || ''} ` +
    `has been moved to ${dto.date} at ${hourForDisplay}.`;

  void this.createNotification(
    existing.patientId,
    titlePatientFr,
    titlePatientEn,
    msgPatientFr,
    msgPatientEn,
  ).catch(() => void 0);

  void this.createNotification(
    existing.medecinId,
    titleDoctorFr,
    titleDoctorEn,
    msgDoctorFr,
    msgDoctorEn,
  ).catch(() => void 0);

  void this.pushIfPossible(
    existing.patient?.expotoken,
    titlePatientFr,
    titlePatientEn,
    msgPatientFr,
    msgPatientEn,
    {
      kind: 'RESERVATION_RESCHEDULED',
      reservationId: reservation.reservationId,
    },
  ).catch(() => void 0);

  void this.pushIfPossible(
    existing.medecin?.expotoken,
    titleDoctorFr,
    titleDoctorEn,
    msgDoctorFr,
    msgDoctorEn,
    {
      kind: 'RESERVATION_RESCHEDULED_DOCTOR',
      reservationId: reservation.reservationId,
    },
  ).catch(() => void 0);

  return {
    success: true,
    message: 'Date modifiée avec succès',
    messageE: 'Date updated successfully',
    reservation,
  };
}

  async findOne(id: number) {
    const reservation = await this.prisma.reservation.findUnique({
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
        hopital: {
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
        abonnement: {
          include: { package: true },
        },
      },
    });

    if (!reservation) {
      throw new NotFoundException({
        message: `Réservation d'ID ${id} introuvable`,
        messageE: `Reservation with ID ${id} not found`,
      });
    }

    let endHour: string | null = null;
    const duration = reservation.medecin?.speciality?.consultationDuration;
    if (typeof duration === 'number' && reservation.hour) {
      endHour = addMinutesToHourString(reservation.hour, duration);
    }

    const [ratingStats, lastFeedbacks] = await Promise.all([
      this.prisma.feedback.aggregate({
        where: { medecinId: reservation.medecinId },
        _avg: { note: true },
        _count: { _all: true },
      }),
      this.prisma.feedback.findMany({
        where: { medecinId: reservation.medecinId },
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
      message: 'Réservation récupérée avec succès',
      messageE: 'Reservation retrieved successfully',
      data: { ...reservation, endHour },
      medecinRating: {
        average: ratingStats._avg.note ?? 0,
        count: ratingStats._count._all,
      },
      lastFeedbacks,
    };
  }

  async findAll(query: QueryReservationDto) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.medecinId) where.medecinId = query.medecinId;
    if (query.hopitalId) where.hopitalId = query.hopitalId;
    if (query.patientId) where.patientId = query.patientId;
    if (query.date) where.date = query.date;
    if (query.type) where.type = query.type;
    if (query.status) where.status = query.status;

    if (query.q && query.q.trim()) {
      const q = query.q.trim();
      where.OR = [
        { patientName: { contains: q } },
        { medecin: { firstName: { contains: q } } },
        { medecin: { lastName: { contains: q } } },
        { patient: { firstName: { contains: q } } },
        { patient: { lastName: { contains: q } } },
        { hopital: { firstName: { contains: q } } },
      ];
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.reservation.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ date: 'asc' }, { hour: 'asc' }],
        include: {
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
          hopital: {
            select: {
              userId: true,
              firstName: true,
              lastName: true,
              profile: true,
            },
          },
          abonnement: {
            include: { package: true },
          },
        },
      }),
      this.prisma.reservation.count({ where }),
    ]);

    const itemsWithEndHour = items.map((item) => {
      const duration = item.medecin?.speciality?.consultationDuration;
      const endHour = (typeof duration === 'number' && item.hour)
        ? addMinutesToHourString(item.hour, duration)
        : null;
      return { ...item, endHour };
    });

    return {
      message: 'Réservations récupérées avec succès',
      messageE: 'Reservations retrieved successfully',
      data: itemsWithEndHour,
      meta: {
        total,
        page,
        limit,
        pageCount: Math.ceil(total / limit),
      },
    };
  }

  async rateDoctor(reservationId: number, dto: RateDoctorDto) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { reservationId },
    });

    if (!reservation) {
      throw new NotFoundException({
        message: `Réservation ${reservationId} introuvable`,
        messageE: `Reservation ${reservationId} not found`,
      });
    }

    if (reservation.status !== ReservationStatus.COMPLETED) {
      throw new BadRequestException({
        message: 'Vous ne pouvez noter qu’après une consultation terminée',
        messageE: 'You can only rate after a completed consultation',
      });
    }

    if (dto.medecinId !== reservation.medecinId || dto.patientId !== reservation.patientId) {
      throw new ForbiddenException({
        message: 'medecinId ou patientId invalide pour cette réservation',
        messageE: 'medecinId or patientId does not match this reservation',
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

    return {
      success: true,
      message: 'Avis enregistré avec succès',
      messageE: 'Feedback saved successfully',
      feedback,
    };
  }
}
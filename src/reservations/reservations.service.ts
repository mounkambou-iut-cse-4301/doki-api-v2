// // src/reservations/reservations.service.ts
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
//   AbonnementStatus,
//   PlanningType,
// } from 'generated/prisma';
// import { UpdateReservationDateDto } from './dto/update-reservation-date.dto';
// import { QueryReservationDto } from './dto/query-reservation.dto';
// import { randomUUID } from 'crypto';
// import { RateDoctorDto } from './dto/rate-doctor.dto';

// // Helper: convertir heure en minutes
// function toMinutes(hour: string): number {
//   const parts = hour.split(':');
//   const H = parseInt(parts[0], 10);
//   const M = parseInt(parts[1], 10);
//   return H * 60 + M;
// }

// // Helper: ajouter des minutes à une heure (retourne HH:MM)
// function addMinutesToHourString(hour: string, minutesToAdd: number): string {
//   const parts = hour.split(':');
//   const h = parseInt(parts[0], 10);
//   const m = parseInt(parts[1], 10);
//   const date = new Date();
//   date.setHours(h, m, 0, 0);
//   date.setMinutes(date.getMinutes() + minutesToAdd);
//   const hh = String(date.getHours()).padStart(2, '0');
//   const mm = String(date.getMinutes()).padStart(2, '0');
//   return `${hh}:${mm}`;
// }

// // Helper: convertir en HH:MM pour l'affichage
// function toDisplayHour(hour: string): string {
//   return hour.split(':').slice(0, 2).join(':');
// }

// // Helper: date à minuit locale
// function dateAtLocalMidnight(tz: string, base = new Date()): Date {
//   const fmt = new Intl.DateTimeFormat('en-CA', {
//     timeZone: tz,
//     year: 'numeric',
//     month: '2-digit',
//     day: '2-digit',
//   });
//   const [y, m, d] = fmt.format(base).split('-').map(Number);
//   return new Date(Date.UTC(y, m - 1, d, 0, 0, 0));
// }

// // Pause entre les consultations (en minutes)
// const PAUSE_MINUTES = 5;

// @Injectable()
// export class ReservationsService {
//   constructor(private readonly prisma: PrismaService) {}

//   /**
//    * Vérifier si l'heure demandée correspond à un créneau valide dans une plage horaire
//    */
//   private isValidSlotInPlanning(
//     planning: any,
//     targetHour: string,
//     consultationDuration: number
//   ): boolean {
//     const startMin = toMinutes(planning.debutHour);
//     const endMin = toMinutes(planning.endHour);
//     const targetMin = toMinutes(targetHour);
//     const step = consultationDuration + PAUSE_MINUTES;
    
//     for (let slotStart = startMin; slotStart + consultationDuration <= endMin; slotStart += step) {
//       if (slotStart === targetMin) {
//         return true;
//       }
//     }
//     return false;
//   }

//   /**
//    * Générer les créneaux disponibles pour un planning
//    */
//   private generateAvailableSlots(planning: any, duration: number): string[] {
//     const slots: string[] = [];
//     const startMin = toMinutes(planning.debutHour);
//     const endMin = toMinutes(planning.endHour);
//     const step = duration + PAUSE_MINUTES;
    
//     for (let m = startMin; m + duration <= endMin; m += step) {
//       const h = Math.floor(m / 60);
//       const min = m % 60;
//       slots.push(`${h.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`);
//     }
//     return slots;
//   }

//   /**
//    * Vérifier si la consultation peut être démarrée
//    * - Peut démarrer 2 minutes avant l'heure prévue
//    * - Peut démarrer à tout moment après l'heure prévue (pas de limite max)
//    */
//   private canStartConsultation(reservation: any): { canStart: boolean; message?: string; messageE?: string } {
//     const now = new Date();
//     const startDateTime = new Date(`${reservation.date}T${reservation.hour}:00`);
    
//     // Peut démarrer 2 minutes avant l'heure prévue
//     const twoMinutesBefore = new Date(startDateTime.getTime() - 2 * 60 * 1000);
    
//     if (now < twoMinutesBefore) {
//       const minutesToWait = Math.ceil((twoMinutesBefore.getTime() - now.getTime()) / (60 * 1000));
//       return {
//         canStart: false,
//         message: `La consultation ne peut pas encore commencer. Elle est prévue à ${reservation.hour}. Vous pouvez commencer 2 minutes avant l'heure prévue (dans ${minutesToWait} minute(s)).`,
//         messageE: `Consultation cannot start yet. It is scheduled for ${reservation.hour}. You can start 2 minutes before the scheduled time (in ${minutesToWait} minute(s)).`,
//       };
//     }
    
//     return { canStart: true };
//   }

//   /**
//    * Vérifier si la consultation peut être terminée
//    * - Peut terminer 5 minutes avant la fin prévue
//    * - Peut terminer à tout moment après la fin prévue
//    */
//   private canCompleteConsultation(reservation: any, duration: number): { canComplete: boolean; message?: string; messageE?: string } {
//     const now = new Date();
//     const startDateTime = new Date(`${reservation.date}T${reservation.hour}:00`);
//     const endDateTime = new Date(startDateTime.getTime() + duration * 60 * 1000);
//     const fiveMinutesBeforeEnd = new Date(endDateTime.getTime() - 5 * 60 * 1000);
    
//     if (now < fiveMinutesBeforeEnd) {
//       const minutesToWait = Math.ceil((fiveMinutesBeforeEnd.getTime() - now.getTime()) / (60 * 1000));
//       return {
//         canComplete: false,
//         message: `La consultation ne peut pas encore être terminée. La fin prévue est à ${addMinutesToHourString(reservation.hour, duration)}. Vous pouvez terminer 5 minutes avant la fin (dans ${minutesToWait} minute(s)).`,
//         messageE: `Consultation cannot be completed yet. The scheduled end time is ${addMinutesToHourString(reservation.hour, duration)}. You can complete 5 minutes before the end (in ${minutesToWait} minute(s)).`,
//       };
//     }
    
//     return { canComplete: true };
//   }

//   /**
//    * Créer une réservation
//    */
//   async create(dto: CreateReservationDto) {
//     const hourForDisplay = toDisplayHour(dto.hour);
    
//     // 1) Valider date et heure future (au moins 6h à l'avance)
//     const dateTime = new Date(`${dto.date}T${hourForDisplay}:00`);
//     if (isNaN(dateTime.getTime())) {
//       throw new BadRequestException({
//         message: 'Format de date/heure invalide',
//         messageE: 'Invalid date/time format',
//       });
//     }

//     const now = new Date();
//     if (dateTime.getTime() <= now.getTime()) {
//       throw new BadRequestException({
//         message: 'La date/heure doit être dans le futur',
//         messageE: 'Date/time must be in the future',
//       });
//     }

//     if (dateTime.getTime() < now.getTime() + 6 * 60 * 60 * 1000) {
//       throw new BadRequestException({
//         message: 'La réservation doit être faite au moins 6h à l\'avance',
//         messageE: 'Reservation must be made at least 6h in advance',
//       });
//     }

//     // 2) Vérifier médecin et patient
//     const medecin = await this.prisma.user.findUnique({
//       where: { userId: dto.medecinId },
//       include: { speciality: true },
//     });

//     if (!medecin || medecin.userType !== UserType.MEDECIN) {
//       throw new NotFoundException({
//         message: `Médecin d'ID ${dto.medecinId} introuvable`,
//         messageE: `Doctor with ID ${dto.medecinId} not found`,
//       });
//     }

//     const patient = await this.prisma.user.findUnique({
//       where: { userId: dto.patientId },
//     });

//     if (!patient || patient.userType !== UserType.PATIENT) {
//       throw new NotFoundException({
//         message: `Patient d'ID ${dto.patientId} introuvable`,
//         messageE: `Patient with ID ${dto.patientId} not found`,
//       });
//     }

//     // 3) Vérifier spécialité
//     const speciality = await this.prisma.speciality.findUnique({
//       where: { specialityId: dto.specialityId },
//     });

//     if (!speciality) {
//       throw new NotFoundException({
//         message: `Spécialité ${dto.specialityId} introuvable`,
//         messageE: `Speciality ${dto.specialityId} not found`,
//       });
//     }

//     if (medecin.specialityId !== dto.specialityId) {
//       throw new BadRequestException({
//         message: 'La spécialité ne correspond pas au médecin',
//         messageE: 'Speciality does not match the doctor',
//       });
//     }

//     // 4) Récupérer la plage horaire du planning
//     const jours = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
//     const jour = jours[dateTime.getDay()];
    
//     let planning: any = null;
//     let duration: number;
//     let consultationPrice: number;
    
//     if (dto.type === 'CALL') {
//       // Chercher une plage horaire ONLINE pour ce jour
//       planning = await this.prisma.planning.findFirst({
//         where: {
//           medecinId: dto.medecinId,
//           jour: jour,
//           type: PlanningType.ONLINE,
//           isActive: true,
//           isOff: false,
//         },
//       });
      
//       if (!planning) {
//         throw new BadRequestException({
//           message: `Aucun créneau de consultation en ligne trouvé pour le ${jour}`,
//           messageE: `No online consultation slot found for ${jour}`,
//         });
//       }
      
//       // Durée et prix par défaut (de la spécialité)
//       duration = speciality.consultationDuration;
//       consultationPrice = Number(speciality.consultationPrice);
      
//       // Vérifier si l'heure demandée correspond à un créneau valide
//       const isValid = this.isValidSlotInPlanning(planning, hourForDisplay, duration);
//       if (!isValid) {
//         throw new BadRequestException({
//           message: `L'heure ${hourForDisplay} n'est pas un créneau valide. Les créneaux sont espacés de ${duration + PAUSE_MINUTES} minutes.`,
//           messageE: `${hourForDisplay} is not a valid slot. Slots are spaced ${duration + PAUSE_MINUTES} minutes apart.`,
//           availableSlots: this.generateAvailableSlots(planning, duration),
//         });
//       }
//     } else {
//       // IN_PERSON
//       if (!dto.hopitalId) {
//         throw new BadRequestException({
//           message: 'L\'ID de l\'hôpital est requis pour une réservation en présentiel',
//           messageE: 'Hospital ID is required for in-person reservation',
//         });
//       }
      
//       // Vérifier l'affiliation médecin-hôpital
//       const hopitalAffiliation = await this.prisma.medecinHopital.findFirst({
//         where: {
//           medecinId: dto.medecinId,
//           hopitalId: dto.hopitalId,
//         },
//       });

//       if (!hopitalAffiliation) {
//         throw new BadRequestException({
//           message: 'Ce médecin n\'exerce pas dans cet hôpital',
//           messageE: 'This doctor does not work at this hospital',
//         });
//       }
      
//       // Chercher une plage horaire IN_PERSON pour ce jour et cet hôpital
//       planning = await this.prisma.planning.findFirst({
//         where: {
//           medecinId: dto.medecinId,
//           hopitalId: dto.hopitalId,
//           jour: jour,
//           type: PlanningType.IN_PERSON,
//           isActive: true,
//           isOff: false,
//         },
//       });
      
//       if (!planning) {
//         throw new BadRequestException({
//           message: `Aucun créneau de consultation en présentiel trouvé pour le ${jour} dans cet hôpital`,
//           messageE: `No in-person consultation slot found for ${jour} at this hospital`,
//         });
//       }
      
//       // Utiliser les valeurs du planning pour IN_PERSON
//       duration = planning.consultationDuration || speciality.consultationDuration;
//       consultationPrice = Number(planning.consultationPrice || speciality.consultationPrice);
      
//       // Vérifier si l'heure demandée correspond à un créneau valide
//       const isValid = this.isValidSlotInPlanning(planning, hourForDisplay, duration);
//       if (!isValid) {
//         throw new BadRequestException({
//           message: `L'heure ${hourForDisplay} n'est pas un créneau valide. Les créneaux sont espacés de ${duration + PAUSE_MINUTES} minutes.`,
//           messageE: `${hourForDisplay} is not a valid slot. Slots are spaced ${duration + PAUSE_MINUTES} minutes apart.`,
//           availableSlots: this.generateAvailableSlots(planning, duration),
//         });
//       }
//     }
    
//     const startMin = toMinutes(hourForDisplay);
//     const endMin = startMin + duration;

//     // 5) Vérifier chevauchement avec d'autres réservations
//     const existingReservations = await this.prisma.reservation.findMany({
//       where: {
//         medecinId: dto.medecinId,
//         date: dto.date,
//         status: { in: [ReservationStatus.PENDING, ReservationStatus.STARTED, ReservationStatus.COMPLETED] },
//       },
//     });

//     for (const r of existingReservations) {
//       const rStart = toMinutes(r.hour);
//       const rEnd = rStart + duration;
//       if (startMin < rEnd && endMin > rStart) {
//         throw new BadRequestException({
//           message: `Chevauchement avec une autre réservation (${r.hour} - ${addMinutesToHourString(r.hour, duration)})`,
//           messageE: `Overlaps another reservation (${r.hour} - ${addMinutesToHourString(r.hour, duration)})`,
//         });
//       }
//     }

//     // 6) Traitement selon le type
//     if (dto.type === 'CALL') {
//       return this.handleCallReservation(
//         dto, medecin, patient, speciality, duration, consultationPrice, hourForDisplay
//       );
//     } else {
//       return this.handleInPersonReservation(
//         dto, medecin, patient, speciality, duration, consultationPrice, hourForDisplay
//       );
//     }
//   }

//   /**
//    * Gestion réservation en ligne (CALL)
//    */
//   private async handleCallReservation(
//     dto: CreateReservationDto,
//     medecin: any,
//     patient: any,
//     speciality: any,
//     duration: number,
//     consultationPrice: number,
//     hourForDisplay: string,
//   ) {
//     // Vérifier abonnement actif
//     const today = dateAtLocalMidnight('Africa/Douala');
//     const activeSubscription = await this.prisma.abonnement.findFirst({
//       where: {
//         patientId: dto.patientId,
//         status: AbonnementStatus.CONFIRMED,
//         endDate: { gte: today },
//         package: {
//           specialityId: dto.specialityId,
//         },
//       },
//       include: { package: true },
//     });

//     if (!activeSubscription) {
//       throw new BadRequestException({
//         message: 'Vous n\'avez pas d\'abonnement actif pour cette spécialité',
//         messageE: 'You have no active subscription for this speciality',
//         requiredAction: 'SUBSCRIBE',
//       });
//     }

//     // Vérifier le quota
//     const usedCount = await this.prisma.reservation.count({
//       where: {
//         patientId: dto.patientId,
//         abonnementId: activeSubscription.abonnementId,
//         type: 'CALL',
//         status: { in: [ReservationStatus.PENDING, ReservationStatus.STARTED, ReservationStatus.COMPLETED] },
//       },
//     });

//     const maxConsultations = activeSubscription.numberOfTimePlanReservation || 0;

//     if (usedCount >= maxConsultations) {
//       throw new BadRequestException({
//         message: 'Vous avez atteint le quota de consultations de votre abonnement',
//         messageE: 'You have reached your subscription consultation quota',
//         usedCount,
//         maxConsultations,
//         requiredAction: 'RENEW_SUBSCRIPTION',
//       });
//     }

//     // Créer la réservation
//     const reservation = await this.prisma.reservation.create({
//       data: {
//         date: dto.date,
//         hour: hourForDisplay,
//         type: dto.type,
//         patientName: dto.patientName,
//         sex: dto.sex,
//         age: dto.age,
//         description: dto.description,
//         medecinId: dto.medecinId,
//         patientId: dto.patientId,
//         location: dto.location || null,
//         amount: 0,
//         abonnementId: activeSubscription.abonnementId,
//         status: ReservationStatus.PENDING,
//       },
//     });

//     return {
//       success: true,
//       message: 'Réservation créée avec succès (abonnement utilisé)',
//       messageE: 'Reservation created successfully (subscription used)',
//       reservation: {
//         ...reservation,
//         usedSubscription: true,
//         consultationsRestantes: maxConsultations - usedCount - 1,
//         consultationPrice,
//         duration,
//         startHour: hourForDisplay,
//         endHour: addMinutesToHourString(hourForDisplay, duration),
//       },
//     };
//   }

//   /**
//    * Gestion réservation en présentiel (IN_PERSON)
//    */
//   private async handleInPersonReservation(
//     dto: CreateReservationDto,
//     medecin: any,
//     patient: any,
//     speciality: any,
//     duration: number,
//     consultationPrice: number,
//     hourForDisplay: string,
//   ) {
//     // Vérifier hôpital
//     const hopital = await this.prisma.user.findUnique({
//       where: { userId: dto.hopitalId, userType: UserType.HOPITAL },
//     });

//     if (!hopital) {
//       throw new NotFoundException({
//         message: `Hôpital d'ID ${dto.hopitalId} introuvable`,
//         messageE: `Hospital with ID ${dto.hopitalId} not found`,
//       });
//     }

//     // Créer réservation (sans transaction pour l'instant)
//     const reservation = await this.prisma.reservation.create({
//       data: {
//         date: dto.date,
//         hour: hourForDisplay,
//         type: dto.type,
//         patientName: dto.patientName,
//         sex: dto.sex,
//         age: dto.age,
//         description: dto.description,
//         medecinId: dto.medecinId,
//         patientId: dto.patientId,
//         location: dto.location || null,
//         hopitalId: dto.hopitalId,
//         amount: consultationPrice, // Montant sans commission pour l'instant
//         status: ReservationStatus.PENDING,
//       },
//     });

//     return {
//       success: true,
//       message: 'Réservation créée avec succès',
//       messageE: 'Reservation created successfully',
//       reservation: {
//         ...reservation,
//         usedSubscription: false,
//         consultationPrice,
//         duration,
//         startHour: hourForDisplay,
//         endHour: addMinutesToHourString(hourForDisplay, duration),
//       },
//     };
//   }

//   /**
//    * Démarrer une consultation
//    * Le médecin clique sur "Démarrer la consultation"
//    */
//   async startConsultation(id: number, userId: number) {
//     const reservation = await this.prisma.reservation.findUnique({
//       where: { reservationId: id },
//       include: { medecin: true },
//     });

//     if (!reservation) {
//       throw new NotFoundException({
//         message: `Réservation ${id} introuvable`,
//         messageE: `Reservation ${id} not found`,
//       });
//     }

//     // Vérifier que c'est le bon médecin
//     if (reservation.medecinId !== userId) {
//       throw new ForbiddenException({
//         message: 'Vous n\'êtes pas autorisé à démarrer cette consultation',
//         messageE: 'You are not authorized to start this consultation',
//       });
//     }

//     // Vérifier que la réservation est en attente
//     if (reservation.status !== ReservationStatus.PENDING) {
//       throw new BadRequestException({
//         message: `Impossible de démarrer une consultation au statut '${reservation.status}'`,
//         messageE: `Cannot start a consultation with status '${reservation.status}'`,
//       });
//     }

//     // Récupérer la durée de consultation
//     const medecin = await this.prisma.user.findUnique({
//       where: { userId: reservation.medecinId },
//       include: { speciality: true },
//     });
    
//     const duration = medecin?.speciality?.consultationDuration || 30;

//     // Vérifier si on peut démarrer
//     const startCheck = this.canStartConsultation(reservation);
//     if (!startCheck.canStart) {
//       throw new BadRequestException({
//         message: startCheck.message,
//         messageE: startCheck.messageE,
//       });
//     }

//     // Mettre à jour le statut
//     const updated = await this.prisma.reservation.update({
//       where: { reservationId: id },
//       data: { status: ReservationStatus.STARTED },
//     });

//     return {
//       success: true,
//       message: 'Consultation démarrée avec succès',
//       messageE: 'Consultation started successfully',
//       reservation: updated,
//     };
//   }

//   /**
//    * Terminer une consultation et créditer le médecin (pour CALL) ou l'hôpital (pour IN_PERSON)
//    * Le médecin clique sur "Terminer la consultation"
//    */
//   async completeConsultation(id: number, userId: number) {
//     const reservation = await this.prisma.reservation.findUnique({
//       where: { reservationId: id },
//       include: { 
//         medecin: { include: { speciality: true } },
//         hopital: true,
//       },
//     });

//     if (!reservation) {
//       throw new NotFoundException({
//         message: `Réservation ${id} introuvable`,
//         messageE: `Reservation ${id} not found`,
//       });
//     }

//     // Vérifier que c'est le bon médecin
//     if (reservation.medecinId !== userId) {
//       throw new ForbiddenException({
//         message: 'Vous n\'êtes pas autorisé à terminer cette consultation',
//         messageE: 'You are not authorized to complete this consultation',
//       });
//     }

//     // Vérifier que la réservation a été démarrée ou est en attente
//     if (reservation.status !== ReservationStatus.STARTED && reservation.status !== ReservationStatus.PENDING) {
//       throw new BadRequestException({
//         message: `Impossible de terminer une consultation au statut '${reservation.status}'`,
//         messageE: `Cannot complete a consultation with status '${reservation.status}'`,
//       });
//     }

//     // Récupérer la durée
//     const duration = reservation.medecin?.speciality?.consultationDuration || 30;

//     // Vérifier si on peut terminer (si elle n'a pas été démarrée, on vérifie quand même)
//     if (reservation.status === ReservationStatus.PENDING) {
//       // Si elle n'a pas été démarrée, on peut la terminer seulement si on est après l'heure de fin
//       const completeCheck = this.canCompleteConsultation(reservation, duration);
//       if (!completeCheck.canComplete) {
//         throw new BadRequestException({
//           message: completeCheck.message,
//           messageE: completeCheck.messageE,
//         });
//       }
//     }

//     // Récupérer les settings de commission
//     const settings = await this.prisma.setting.findFirst();
    
//     let amountToCredit: number;
//     let platformCommission: number;
//     let creditTo: string;

//     if (reservation.type === 'CALL') {
//       // Pour CALL: créditer le médecin
//       const consultationPrice = Number(reservation.medecin?.speciality?.consultationPrice || 0);
      
//       if (settings) {
//         if (settings.onlineType === 'PERCENTAGE') {
//           platformCommission = consultationPrice * (settings.onlineValue / 100);
//           amountToCredit = consultationPrice - platformCommission;
//         } else {
//           platformCommission = settings.onlineValue;
//           amountToCredit = consultationPrice - platformCommission;
//         }
//       } else {
//         platformCommission = 0;
//         amountToCredit = consultationPrice;
//       }
      
//       creditTo = `médecin ${reservation.medecin.firstName} ${reservation.medecin.lastName}`;
      
//       // Créditer le médecin
//       const medecinSolde = await this.prisma.soldeMedecin.findFirst({
//         where: { medecinId: reservation.medecinId },
//       });
      
//       if (medecinSolde) {
//         await this.prisma.soldeMedecin.update({
//           where: { soldeMedecinId: medecinSolde.soldeMedecinId },
//           data: { solde: { increment: amountToCredit } },
//         });
//       } else {
//         await this.prisma.soldeMedecin.create({
//           data: { medecinId: reservation.medecinId, solde: amountToCredit },
//         });
//       }
//     } else {
//       // Pour IN_PERSON: créditer l'hôpital
//       const consultationPrice = Number(reservation.amount || 0);
      
//       if (settings) {
//         if (settings.onsiteType === 'PERCENTAGE') {
//           platformCommission = consultationPrice * (settings.onsiteValue / 100);
//           amountToCredit = consultationPrice - platformCommission;
//         } else {
//           platformCommission = settings.onsiteValue;
//           amountToCredit = consultationPrice - platformCommission;
//         }
//       } else {
//         platformCommission = 0;
//         amountToCredit = consultationPrice;
//       }
      
//       creditTo = `hôpital ${reservation.hopital?.firstName || ''}`;
      
//       // Créditer l'hôpital
//       const hopitalSolde = await this.prisma.soldeMedecin.findFirst({
//         where: { medecinId: reservation.hopitalId! },
//       });
      
//       if (hopitalSolde) {
//         await this.prisma.soldeMedecin.update({
//           where: { soldeMedecinId: hopitalSolde.soldeMedecinId },
//           data: { solde: { increment: amountToCredit } },
//         });
//       } else if (reservation.hopitalId) {
//         await this.prisma.soldeMedecin.create({
//           data: { medecinId: reservation.hopitalId, solde: amountToCredit },
//         });
//       }
      
//       // Mettre à jour la transaction si elle existe
//       if (reservation.transactionId) {
//         await this.prisma.transaction.update({
//           where: { transactionId: reservation.transactionId },
//           data: { 
//             status: TransactionStatus.PAID,
//             paymentId: `TR-RES-${randomUUID()}`,
//           },
//         });
//       }
//     }

//     // Mettre à jour le statut de la réservation
//     const updated = await this.prisma.reservation.update({
//       where: { reservationId: id },
//       data: { status: ReservationStatus.COMPLETED },
//     });

//     return {
//       success: true,
//       message: 'Consultation terminée avec succès',
//       messageE: 'Consultation completed successfully',
//       details: {
//         reservationId: id,
//         status: ReservationStatus.COMPLETED,
//         consultationPrice: reservation.amount || 0,
//         platformCommission,
//         amountCredited: amountToCredit,
//         creditedTo: creditTo,
//       },
//       reservation: updated,
//     };
//   }

//   /**
//    * Mettre à jour date/heure d'une réservation
//    */
//   async updateDate(id: number, dto: UpdateReservationDateDto) {
//     const hourForDisplay = toDisplayHour(dto.hour);
    
//     const existing = await this.prisma.reservation.findUnique({
//       where: { reservationId: id },
//       include: { 
//         medecin: { include: { speciality: true } },
//         hopital: true,
//       },
//     });

//     if (!existing) {
//       throw new NotFoundException({
//         message: `Réservation ${id} introuvable`,
//         messageE: `Reservation ${id} not found`,
//       });
//     }

//     if (existing.status !== ReservationStatus.PENDING) {
//       throw new BadRequestException({
//         message: `Impossible de modifier une réservation ${existing.status}`,
//         messageE: `Cannot modify a ${existing.status} reservation`,
//       });
//     }

//     const newDateTime = new Date(`${dto.date}T${hourForDisplay}:00`);
//     const now = new Date();
    
//     if (isNaN(newDateTime.getTime()) || newDateTime <= now) {
//       throw new BadRequestException({
//         message: 'La date/heure doit être valide et future',
//         messageE: 'Date/time must be valid and in the future',
//       });
//     }

//     if (newDateTime.getTime() < now.getTime() + 24 * 60 * 60 * 1000) {
//       throw new BadRequestException({
//         message: 'La modification doit être faite au moins 24h à l\'avance',
//         messageE: 'Modification must be made at least 24h in advance',
//       });
//     }

//     // Récupérer la plage horaire
//     const jours = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
//     const jour = jours[newDateTime.getDay()];
    
//     let planning: any = null;
//     let duration: number;
    
//     if (existing.type === 'CALL') {
//       planning = await this.prisma.planning.findFirst({
//         where: {
//           medecinId: existing.medecinId,
//           jour: jour,
//           type: PlanningType.ONLINE,
//           isActive: true,
//           isOff: false,
//         },
//       });
      
//       if (!planning) {
//         throw new BadRequestException({
//           message: `Aucun créneau de consultation en ligne trouvé pour le ${jour}`,
//           messageE: `No online consultation slot found for ${jour}`,
//         });
//       }
      
//       duration = existing.medecin.speciality?.consultationDuration || 0;
      
//       const isValid = this.isValidSlotInPlanning(planning, hourForDisplay, duration);
//       if (!isValid) {
//         throw new BadRequestException({
//           message: `L'heure ${hourForDisplay} n'est pas un créneau valide`,
//           messageE: `${hourForDisplay} is not a valid slot`,
//         });
//       }
//     } else {
//       planning = await this.prisma.planning.findFirst({
//         where: {
//           medecinId: existing.medecinId,
//           hopitalId: existing.hopitalId,
//           jour: jour,
//           type: PlanningType.IN_PERSON,
//           isActive: true,
//           isOff: false,
//         },
//       });
      
//       if (!planning) {
//         throw new BadRequestException({
//           message: `Aucun créneau de consultation en présentiel trouvé pour le ${jour}`,
//           messageE: `No in-person consultation slot found for ${jour}`,
//         });
//       }
      
//       duration = planning.consultationDuration || existing.medecin.speciality?.consultationDuration || 0;
      
//       const isValid = this.isValidSlotInPlanning(planning, hourForDisplay, duration);
//       if (!isValid) {
//         throw new BadRequestException({
//           message: `L'heure ${hourForDisplay} n'est pas un créneau valide`,
//           messageE: `${hourForDisplay} is not a valid slot`,
//         });
//       }
//     }
    
//     const startMin = toMinutes(hourForDisplay);
//     const endMin = startMin + (duration || 0);

//     // Vérifier chevauchement
//     const others = await this.prisma.reservation.findMany({
//       where: {
//         medecinId: existing.medecinId,
//         date: dto.date,
//         reservationId: { not: id },
//         status: { in: [ReservationStatus.PENDING, ReservationStatus.STARTED, ReservationStatus.COMPLETED] },
//       },
//     });

//     for (const r of others) {
//       const rStart = toMinutes(r.hour);
//       const rEnd = rStart + (duration || 0);
//       if (startMin < rEnd && endMin > rStart) {
//         throw new BadRequestException({
//           message: 'Chevauchement avec une autre réservation',
//           messageE: 'Overlaps another reservation',
//         });
//       }
//     }

//     const reservation = await this.prisma.reservation.update({
//       where: { reservationId: id },
//       data: { date: dto.date, hour: hourForDisplay },
//     });

//     return {
//       success: true,
//       message: 'Date modifiée avec succès',
//       messageE: 'Date updated successfully',
//       reservation,
//     };
//   }

//   /**
//    * Récupérer une réservation par ID
//    */
//   async findOne(id: number) {
//     const reservation = await this.prisma.reservation.findUnique({
//       where: { reservationId: id },
//       include: {
//         medecin: {
//           select: {
//             userId: true,
//             firstName: true,
//             lastName: true,
//             email: true,
//             profile: true,
//             speciality: {
//               select: {
//                 specialityId: true,
//                 name: true,
//                 consultationPrice: true,
//                 consultationDuration: true,
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
//             profile: true,
//           },
//         },
//         hopital: {
//           select: {
//             userId: true,
//             firstName: true,
//             lastName: true,
//             email: true,
//             profile: true,
//           },
//         },
//         transaction: true,
//         ordonance: true,
//         abonnement: {
//           include: { package: true },
//         },
//       },
//     });

//     if (!reservation) {
//       throw new NotFoundException({
//         message: `Réservation d'ID ${id} introuvable`,
//         messageE: `Reservation with ID ${id} not found`,
//       });
//     }

//     let endHour: string | null = null;
//     const duration = reservation.medecin?.speciality?.consultationDuration;
//     if (typeof duration === 'number' && reservation.hour) {
//       endHour = addMinutesToHourString(reservation.hour, duration);
//     }

//     const [ratingStats, lastFeedbacks] = await Promise.all([
//       this.prisma.feedback.aggregate({
//         where: { medecinId: reservation.medecinId },
//         _avg: { note: true },
//         _count: { _all: true },
//       }),
//       this.prisma.feedback.findMany({
//         where: { medecinId: reservation.medecinId },
//         orderBy: { createdAt: 'desc' },
//         take: 3,
//         include: {
//           patient: {
//             select: {
//               userId: true,
//               firstName: true,
//               lastName: true,
//               profile: true,
//             },
//           },
//         },
//       }),
//     ]);

//     return {
//       message: 'Réservation récupérée avec succès',
//       messageE: 'Reservation retrieved successfully',
//       data: { ...reservation, endHour },
//       medecinRating: {
//         average: ratingStats._avg.note ?? 0,
//         count: ratingStats._count._all,
//       },
//       lastFeedbacks,
//     };
//   }

//   /**
//    * Lister les réservations
//    */
//   async findAll(query: QueryReservationDto) {
//     const page = query.page || 1;
//     const limit = query.limit || 10;
//     const skip = (page - 1) * limit;

//     const where: any = {};

//     if (query.medecinId) where.medecinId = query.medecinId;
//     if (query.patientId) where.patientId = query.patientId;
//     if (query.date) where.date = query.date;
//     if (query.type) where.type = query.type;
//     if (query.status) where.status = query.status;

//     if (query.q && query.q.trim()) {
//       const q = query.q.trim();
//       where.OR = [
//         { patientName: { contains: q } },
//         { medecin: { firstName: { contains: q } } },
//         { medecin: { lastName: { contains: q } } },
//         { patient: { firstName: { contains: q } } },
//         { patient: { lastName: { contains: q } } },
//         { hopital: { firstName: { contains: q } } },
//       ];
//     }

//     const [items, total] = await this.prisma.$transaction([
//       this.prisma.reservation.findMany({
//         where,
//         skip,
//         take: limit,
//         orderBy: [{ date: 'asc' }, { hour: 'asc' }],
//         include: {
//           medecin: {
//             select: {
//               userId: true,
//               firstName: true,
//               lastName: true,
//               profile: true,
//               speciality: {
//                 select: {
//                   specialityId: true,
//                   name: true,
//                   consultationPrice: true,
//                   consultationDuration: true,
//                 },
//               },
//             },
//           },
//           patient: {
//             select: {
//               userId: true,
//               firstName: true,
//               lastName: true,
//               profile: true,
//             },
//           },
//           hopital: {
//             select: {
//               userId: true,
//               firstName: true,
//               lastName: true,
//               profile: true,
//             },
//           },
//           abonnement: {
//             include: { package: true },
//           },
//         },
//       }),
//       this.prisma.reservation.count({ where }),
//     ]);

//     const itemsWithEndHour = items.map((item) => {
//       const duration = item.medecin?.speciality?.consultationDuration;
//       const endHour = (typeof duration === 'number' && item.hour)
//         ? addMinutesToHourString(item.hour, duration)
//         : null;
//       return { ...item, endHour };
//     });

//     return {
//       message: 'Réservations récupérées avec succès',
//       messageE: 'Reservations retrieved successfully',
//       data: itemsWithEndHour,
//       meta: {
//         total,
//         page,
//         limit,
//         pageCount: Math.ceil(total / limit),
//       },
//     };
//   }

//   /**
//    * Noter un médecin
//    */
//   async rateDoctor(reservationId: number, dto: RateDoctorDto) {
//     const reservation = await this.prisma.reservation.findUnique({
//       where: { reservationId },
//     });

//     if (!reservation) {
//       throw new NotFoundException({
//         message: `Réservation ${reservationId} introuvable`,
//         messageE: `Reservation ${reservationId} not found`,
//       });
//     }

//     if (reservation.status !== ReservationStatus.COMPLETED) {
//       throw new BadRequestException({
//         message: 'Vous ne pouvez noter qu’après une consultation terminée',
//         messageE: 'You can only rate after a completed consultation',
//       });
//     }

//     if (dto.medecinId !== reservation.medecinId || dto.patientId !== reservation.patientId) {
//       throw new ForbiddenException({
//         message: 'medecinId ou patientId invalide pour cette réservation',
//         messageE: 'medecinId or patientId does not match this reservation',
//       });
//     }

//     const feedback = await this.prisma.feedback.create({
//       data: {
//         medecinId: dto.medecinId,
//         patientId: dto.patientId,
//         note: dto.note,
//         comment: dto.comment,
//       },
//     });

//     return {
//       success: true,
//       message: 'Avis enregistré avec succès',
//       messageE: 'Feedback saved successfully',
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
  AbonnementStatus,
  PlanningType,
} from 'generated/prisma';
import { UpdateReservationDateDto } from './dto/update-reservation-date.dto';
import { QueryReservationDto } from './dto/query-reservation.dto';
import { randomUUID } from 'crypto';
import { RateDoctorDto } from './dto/rate-doctor.dto';
import { bi, isValidExpoToken, sendExpoPush } from 'src/utils/expo-push';

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

  async create(dto: CreateReservationDto) {
    const hourForDisplay = toDisplayHour(dto.hour);

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

    if (dateTime.getTime() < now.getTime() + 6 * 60 * 60 * 1000) {
      throw new BadRequestException({
        message: 'La réservation doit être faite au moins 6h à l\'avance',
        messageE: 'Reservation must be made at least 6h in advance',
      });
    }

    const medecin = await this.prisma.user.findUnique({
      where: { userId: dto.medecinId },
      include: { speciality: true },
    });

    if (!medecin || medecin.userType !== UserType.MEDECIN) {
      throw new NotFoundException({
        message: `Médecin d'ID ${dto.medecinId} introuvable`,
        messageE: `Doctor with ID ${dto.medecinId} not found`,
      });
    }

    const patient = await this.prisma.user.findUnique({
      where: { userId: dto.patientId },
    });

    if (!patient || patient.userType !== UserType.PATIENT) {
      throw new NotFoundException({
        message: `Patient d'ID ${dto.patientId} introuvable`,
        messageE: `Patient with ID ${dto.patientId} not found`,
      });
    }

    const speciality = await this.prisma.speciality.findUnique({
      where: { specialityId: dto.specialityId },
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

    const jours = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
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
          message: `Aucun créneau de consultation en ligne trouvé pour le ${jour}`,
          messageE: `No online consultation slot found for ${jour}`,
        });
      }

      duration = speciality.consultationDuration;
      consultationPrice = Number(speciality.consultationPrice);

      const isValid = this.isValidSlotInPlanning(planning, hourForDisplay, duration);
      if (!isValid) {
        throw new BadRequestException({
          message: `L'heure ${hourForDisplay} n'est pas un créneau valide. Les créneaux sont espacés de ${duration + PAUSE_MINUTES} minutes.`,
          messageE: `${hourForDisplay} is not a valid slot. Slots are spaced ${duration + PAUSE_MINUTES} minutes apart.`,
          availableSlots: this.generateAvailableSlots(planning, duration),
        });
      }
    } else {
      if (!dto.hopitalId) {
        throw new BadRequestException({
          message: 'L\'ID de l\'hôpital est requis pour une réservation en présentiel',
          messageE: 'Hospital ID is required for in-person reservation',
        });
      }

      const hopitalAffiliation = await this.prisma.medecinHopital.findFirst({
        where: {
          medecinId: dto.medecinId,
          hopitalId: dto.hopitalId,
        },
      });

      if (!hopitalAffiliation) {
        throw new BadRequestException({
          message: 'Ce médecin n\'exerce pas dans cet hôpital',
          messageE: 'This doctor does not work at this hospital',
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
          message: `Aucun créneau de consultation en présentiel trouvé pour le ${jour} dans cet hôpital`,
          messageE: `No in-person consultation slot found for ${jour} at this hospital`,
        });
      }

      duration = planning.consultationDuration || speciality.consultationDuration;
      consultationPrice = Number(planning.consultationPrice || speciality.consultationPrice);

      const isValid = this.isValidSlotInPlanning(planning, hourForDisplay, duration);
      if (!isValid) {
        throw new BadRequestException({
          message: `L'heure ${hourForDisplay} n'est pas un créneau valide. Les créneaux sont espacés de ${duration + PAUSE_MINUTES} minutes.`,
          messageE: `${hourForDisplay} is not a valid slot. Slots are spaced ${duration + PAUSE_MINUTES} minutes apart.`,
          availableSlots: this.generateAvailableSlots(planning, duration),
        });
      }
    }

    const startMin = toMinutes(hourForDisplay);
    const endMin = startMin + duration;

    const existingReservations = await this.prisma.reservation.findMany({
      where: {
        medecinId: dto.medecinId,
        date: dto.date,
        status: { in: [ReservationStatus.PENDING, ReservationStatus.STARTED, ReservationStatus.COMPLETED] },
      },
    });

    for (const r of existingReservations) {
      const rStart = toMinutes(r.hour);
      const rEnd = rStart + duration;
      if (startMin < rEnd && endMin > rStart) {
        throw new BadRequestException({
          message: `Chevauchement avec une autre réservation (${r.hour} - ${addMinutesToHourString(r.hour, duration)})`,
          messageE: `Overlaps another reservation (${r.hour} - ${addMinutesToHourString(r.hour, duration)})`,
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
    } else {
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
    const activeSubscription = await this.prisma.abonnement.findFirst({
      where: {
        patientId: dto.patientId,
        status: AbonnementStatus.CONFIRMED,
        endDate: { gte: today },
        package: {
          specialityId: dto.specialityId,
        },
      },
      include: { package: true },
    });

    if (!activeSubscription) {
      throw new BadRequestException({
        message: 'Vous n\'avez pas d\'abonnement actif pour cette spécialité',
        messageE: 'You have no active subscription for this speciality',
        requiredAction: 'SUBSCRIBE',
      });
    }

    const usedCount = await this.prisma.reservation.count({
      where: {
        patientId: dto.patientId,
        abonnementId: activeSubscription.abonnementId,
        type: 'CALL',
        status: { in: [ReservationStatus.PENDING, ReservationStatus.STARTED, ReservationStatus.COMPLETED] },
      },
    });

    const maxConsultations = activeSubscription.numberOfTimePlanReservation || 0;

    if (usedCount >= maxConsultations) {
      throw new BadRequestException({
        message: 'Vous avez atteint le quota de consultations de votre abonnement',
        messageE: 'You have reached your subscription consultation quota',
        usedCount,
        maxConsultations,
        requiredAction: 'RENEW_SUBSCRIPTION',
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
        amount: 0,
        abonnementId: activeSubscription.abonnementId,
        status: ReservationStatus.PENDING,
      },
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
        consultationsRestantes: maxConsultations - usedCount - 1,
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

    if (reservation.medecinId !== userId) {
      throw new ForbiddenException({
        message: 'Vous n\'êtes pas autorisé à démarrer cette consultation',
        messageE: 'You are not authorized to start this consultation',
      });
    }

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

    if (reservation.medecinId !== userId) {
      throw new ForbiddenException({
        message: 'Vous n\'êtes pas autorisé à terminer cette consultation',
        messageE: 'You are not authorized to complete this consultation',
      });
    }

    if (reservation.status !== ReservationStatus.STARTED && reservation.status !== ReservationStatus.PENDING) {
      throw new BadRequestException({
        message: `Impossible de terminer une consultation au statut '${reservation.status}'`,
        messageE: `Cannot complete a consultation with status '${reservation.status}'`,
      });
    }

    const duration = reservation.medecin?.speciality?.consultationDuration || 30;

    if (reservation.status === ReservationStatus.PENDING) {
      const completeCheck = this.canCompleteConsultation(reservation, duration);
      if (!completeCheck.canComplete) {
        throw new BadRequestException({
          message: completeCheck.message,
          messageE: completeCheck.messageE,
        });
      }
    }

    const settings = await this.prisma.setting.findFirst();

    let amountToCredit: number;
    let platformCommission: number;
    let creditTo: string;

    if (reservation.type === 'CALL') {
      const consultationPrice = Number(reservation.medecin?.speciality?.consultationPrice || 0);

      if (settings) {
        if (settings.onlineType === 'PERCENTAGE') {
          platformCommission = consultationPrice * (settings.onlineValue / 100);
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

      const medecinSolde = await this.prisma.soldeMedecin.findFirst({
        where: { medecinId: reservation.medecinId },
      });

      if (medecinSolde) {
        await this.prisma.soldeMedecin.update({
          where: { soldeMedecinId: medecinSolde.soldeMedecinId },
          data: { solde: { increment: amountToCredit } },
        });
      } else {
        await this.prisma.soldeMedecin.create({
          data: { medecinId: reservation.medecinId, solde: amountToCredit },
        });
      }
    } else {
      const consultationPrice = Number(reservation.amount || 0);

      if (settings) {
        if (settings.onsiteType === 'PERCENTAGE') {
          platformCommission = consultationPrice * (settings.onsiteValue / 100);
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

      const hopitalSolde = await this.prisma.soldeMedecin.findFirst({
        where: { medecinId: reservation.hopitalId! },
      });

      if (hopitalSolde) {
        await this.prisma.soldeMedecin.update({
          where: { soldeMedecinId: hopitalSolde.soldeMedecinId },
          data: { solde: { increment: amountToCredit } },
        });
      } else if (reservation.hopitalId) {
        await this.prisma.soldeMedecin.create({
          data: { medecinId: reservation.hopitalId, solde: amountToCredit },
        });
      }

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
        consultationPrice: reservation.amount || 0,
        platformCommission,
        amountCredited: amountToCredit,
        creditedTo: creditTo,
      },
      reservation: updated,
    };
  }

  async updateDate(id: number, dto: UpdateReservationDateDto) {
    const hourForDisplay = toDisplayHour(dto.hour);

    const existing = await this.prisma.reservation.findUnique({
      where: { reservationId: id },
      include: {
        medecin: { include: { speciality: true } },
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
        message: `Impossible de modifier une réservation ${existing.status}`,
        messageE: `Cannot modify a ${existing.status} reservation`,
      });
    }

    const newDateTime = new Date(`${dto.date}T${hourForDisplay}:00`);
    const now = new Date();

    if (isNaN(newDateTime.getTime()) || newDateTime <= now) {
      throw new BadRequestException({
        message: 'La date/heure doit être valide et future',
        messageE: 'Date/time must be valid and in the future',
      });
    }

    if (newDateTime.getTime() < now.getTime() + 24 * 60 * 60 * 1000) {
      throw new BadRequestException({
        message: 'La modification doit être faite au moins 24h à l\'avance',
        messageE: 'Modification must be made at least 24h in advance',
      });
    }

    const jours = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
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
          message: `Aucun créneau de consultation en ligne trouvé pour le ${jour}`,
          messageE: `No online consultation slot found for ${jour}`,
        });
      }

      duration = existing.medecin.speciality?.consultationDuration || 0;

      const isValid = this.isValidSlotInPlanning(planning, hourForDisplay, duration);
      if (!isValid) {
        throw new BadRequestException({
          message: `L'heure ${hourForDisplay} n'est pas un créneau valide`,
          messageE: `${hourForDisplay} is not a valid slot`,
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
          message: `Aucun créneau de consultation en présentiel trouvé pour le ${jour}`,
          messageE: `No in-person consultation slot found for ${jour}`,
        });
      }

      duration = planning.consultationDuration || existing.medecin.speciality?.consultationDuration || 0;

      const isValid = this.isValidSlotInPlanning(planning, hourForDisplay, duration);
      if (!isValid) {
        throw new BadRequestException({
          message: `L'heure ${hourForDisplay} n'est pas un créneau valide`,
          messageE: `${hourForDisplay} is not a valid slot`,
        });
      }
    }

    const startMin = toMinutes(hourForDisplay);
    const endMin = startMin + (duration || 0);

    const others = await this.prisma.reservation.findMany({
      where: {
        medecinId: existing.medecinId,
        date: dto.date,
        reservationId: { not: id },
        status: { in: [ReservationStatus.PENDING, ReservationStatus.STARTED, ReservationStatus.COMPLETED] },
      },
    });

    for (const r of others) {
      const rStart = toMinutes(r.hour);
      const rEnd = rStart + (duration || 0);
      if (startMin < rEnd && endMin > rStart) {
        throw new BadRequestException({
          message: 'Chevauchement avec une autre réservation',
          messageE: 'Overlaps another reservation',
        });
      }
    }

    const reservation = await this.prisma.reservation.update({
      where: { reservationId: id },
      data: { date: dto.date, hour: hourForDisplay },
    });

    const titlePatientFr = 'Réservation modifiée';
    const titlePatientEn = 'Reservation updated';
    const msgPatientFr = `Votre réservation a été reprogrammée au ${dto.date} à ${hourForDisplay}.`;
    const msgPatientEn = `Your reservation has been rescheduled to ${dto.date} at ${hourForDisplay}.`;

    const titleDoctorFr = 'Réservation reprogrammée';
    const titleDoctorEn = 'Reservation rescheduled';
    const msgDoctorFr = `La réservation de ${existing.patient?.firstName || 'un patient'} ${existing.patient?.lastName || ''} a été déplacée au ${dto.date} à ${hourForDisplay}.`;
    const msgDoctorEn = `The reservation of ${existing.patient?.firstName || 'a patient'} ${existing.patient?.lastName || ''} has been moved to ${dto.date} at ${hourForDisplay}.`;

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
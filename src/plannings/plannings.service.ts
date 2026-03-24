// src/planning/plannings.service.ts
import { 
  BadRequestException, 
  ConflictException, 
  Injectable, 
  NotFoundException,
  Logger
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePlanningDto, PlanningSlotDto } from './dto/create-planning.dto';
import { UpdateJourStatusDto } from './dto/update-jour-status.dto';
import { GetSlotsDto } from './dto/get-slots.dto';
import { UserType, PlanningType } from 'generated/prisma';

@Injectable()
export class PlanningsService {
  private readonly logger = new Logger(PlanningsService.name);

  constructor(private readonly prisma: PrismaService) {}

  private timeToMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  }

  private minutesToTime(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:00`;
  }

  private getJourFromDate(date: string): string {
    const jours = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
    const dt = new Date(date);
    return jours[dt.getDay()];
  }

  /** Valider un créneau individuel - retourne les erreurs sans bloquer */
  private async validateSlot(medecinId: number, slot: PlanningSlotDto, jour: string): Promise<{ valid: boolean; error?: string }> {
    const startMin = this.timeToMinutes(slot.debutHour);
    const endMin = this.timeToMinutes(slot.endHour);
    
    if (startMin >= endMin) {
      return {
        valid: false,
        error: `L'heure de début (${slot.debutHour}) doit être antérieure à l'heure de fin (${slot.endHour})`
      };
    }

    if (endMin - startMin < 15) {
      return {
        valid: false,
        error: `La durée minimale d'un créneau est de 15 minutes`
      };
    }

    // Validation pour les créneaux en présentiel
    if (slot.type === PlanningType.IN_PERSON) {
      if (!slot.hopitalId) {
        return {
          valid: false,
          error: `L'ID de l'hôpital est obligatoire pour un créneau en présentiel`
        };
      }

      // Vérifier que le prix est présent
      if (slot.consultationPrice === undefined || slot.consultationPrice === null) {
        return {
          valid: false,
          error: `Le prix de consultation est obligatoire pour un créneau en présentiel`
        };
      }

      // Vérifier que la durée est présente
      if (slot.consultationDuration === undefined || slot.consultationDuration === null) {
        return {
          valid: false,
          error: `La durée de consultation est obligatoire pour un créneau en présentiel`
        };
      }

      if (slot.consultationPrice < 0) {
        return {
          valid: false,
          error: `Le prix de consultation ne peut pas être négatif`
        };
      }

      if (slot.consultationDuration < 15) {
        return {
          valid: false,
          error: `La durée de consultation doit être d'au moins 15 minutes`
        };
      }

      // Vérifier l'existence de l'hôpital
      const hopital = await this.prisma.user.findFirst({
        where: { userId: slot.hopitalId, userType: UserType.HOPITAL }
      });

      if (!hopital) {
        return {
          valid: false,
          error: `Hôpital avec ID ${slot.hopitalId} introuvable`
        };
      }

      // Vérifier l'affiliation
      const affiliation = await this.prisma.medecinHopital.findUnique({
        where: {
          medecinId_hopitalId: {
            medecinId,
            hopitalId: slot.hopitalId
          }
        }
      });

      if (!affiliation) {
        return {
          valid: false,
          error: `Le médecin n'est pas affilié à cet hôpital`
        };
      }
    }
    
    // Pour les créneaux en ligne, on ignore les prix/durées
    return { valid: true };
  }

  /** Vérifier les chevauchements entre créneaux d'un même jour */
  private checkOverlaps(slots: PlanningSlotDto[], jour: string): { valid: boolean; error?: string } {
    const sorted = [...slots].sort((a, b) => 
      this.timeToMinutes(a.debutHour) - this.timeToMinutes(b.debutHour)
    );

    for (let i = 0; i < sorted.length - 1; i++) {
      const current = sorted[i];
      const next = sorted[i + 1];
      const currentEnd = this.timeToMinutes(current.endHour);
      const nextStart = this.timeToMinutes(next.debutHour);

      if (currentEnd > nextStart) {
        return {
          valid: false,
          error: `Les créneaux se chevauchent: ${current.debutHour}-${current.endHour} et ${next.debutHour}-${next.endHour}`
        };
      }
    }
    return { valid: true };
  }

  /** Récupérer les infos du médecin avec sa spécialité */
  private async getMedecinWithSpeciality(medecinId: number) {
    const medecin = await this.prisma.user.findUnique({
      where: { userId: medecinId, userType: UserType.MEDECIN },
      include: { speciality: true }
    });

    if (!medecin) {
      throw new NotFoundException({
        message: `Médecin avec ID ${medecinId} introuvable`,
        messageE: `Doctor with ID ${medecinId} not found`
      });
    }

    if (!medecin.speciality) {
      throw new BadRequestException({
        message: 'Le médecin n\'a pas de spécialité configurée',
        messageE: 'Doctor does not have a specialty configured'
      });
    }

    return medecin;
  }

  /** Créer ou mettre à jour les plannings d'un médecin (UPSERT) */
  async createOrUpdate(dto: CreatePlanningDto) {
    this.logger.log(`Starting createOrUpdate for doctor ${dto.medecinId}`);
    
    // Vérifier que le médecin existe
    const medecin = await this.prisma.user.findUnique({
      where: { userId: dto.medecinId, userType: UserType.MEDECIN }
    });

    if (!medecin) {
      throw new NotFoundException({
        message: `Médecin avec ID ${dto.medecinId} introuvable`,
        messageE: `Doctor with ID ${dto.medecinId} not found`
      });
    }

    const results = {
      created: [] as any[],
      updated: [] as any[],
      deleted: [] as any[],
      errors: [] as { jour: string; slot?: string; error: string }[]
    };

    for (const jourPlanning of dto.plannings) {
      this.logger.log(`Processing ${jourPlanning.jour}, isOff: ${jourPlanning.isOff}, slots count: ${jourPlanning.slots?.length || 0}`);
      
      try {
        const { jour, isOff, slots } = jourPlanning;

        if (isOff) {
          this.logger.log(`Setting ${jour} as OFF`);
          
          const deletedNormal = await this.prisma.planning.deleteMany({
            where: { medecinId: dto.medecinId, jour, isOff: false }
          });
          
          if (deletedNormal.count > 0) {
            results.deleted.push({ jour, count: deletedNormal.count, type: 'normal' });
          }
          
          const existingOff = await this.prisma.planning.findFirst({
            where: { medecinId: dto.medecinId, jour, isOff: true }
          });
          
          if (existingOff) {
            const updated = await this.prisma.planning.update({
              where: { planningId: existingOff.planningId },
              data: { isActive: true, updatedAt: new Date() }
            });
            results.updated.push({ jour, status: 'off', planningId: updated.planningId });
          } else {
            const offRecord = await this.prisma.planning.create({
              data: {
                medecinId: dto.medecinId,
                jour,
                debutHour: '00:00:00',
                endHour: '00:00:00',
                type: PlanningType.ONLINE,
                hopitalId: null,
                isOff: true,
                isActive: true,
                consultationPrice: null,
                consultationDuration: null
              }
            });
            results.created.push({ jour, status: 'off', planningId: offRecord.planningId });
          }
        } 
        else if (slots && slots.length > 0) {
          this.logger.log(`Processing ${slots.length} slots for ${jour}`);
          
          // Valider chaque créneau individuellement et collecter les erreurs
          const validSlots: PlanningSlotDto[] = [];
          const slotErrors: { slot: string; error: string }[] = [];
          
          for (const slot of slots) {
            const validation = await this.validateSlot(dto.medecinId, slot, jour);
            if (validation.valid) {
              validSlots.push(slot);
            } else {
              slotErrors.push({
                slot: `${slot.debutHour}-${slot.endHour} (${slot.type})`,
                error: validation.error!
              });
            }
          }
          
          // Ajouter les erreurs de validation aux résultats
          for (const err of slotErrors) {
            results.errors.push({
              jour,
              slot: err.slot,
              error: err.error
            });
          }
          
          // S'il n'y a pas de créneaux valides, passer au jour suivant
          if (validSlots.length === 0) {
            this.logger.log(`No valid slots for ${jour}, skipping...`);
            continue;
          }
          
          // Vérifier les chevauchements entre les créneaux valides
          const overlapCheck = this.checkOverlaps(validSlots, jour);
          if (!overlapCheck.valid) {
            results.errors.push({
              jour,
              error: overlapCheck.error!
            });
            continue;
          }

          // Supprimer le OFF si existant
          await this.prisma.planning.deleteMany({
            where: { medecinId: dto.medecinId, jour, isOff: true }
          });

          // Traiter les créneaux valides
          for (const slot of validSlots) {
            const hopitalIdValue = slot.hopitalId || null;
            
            const existing = await this.prisma.planning.findFirst({
              where: {
                medecinId: dto.medecinId,
                jour,
                debutHour: slot.debutHour,
                type: slot.type,
                hopitalId: hopitalIdValue,
                isOff: false
              }
            });
            
            // Pour les créneaux en ligne, on ignore les prix/durées
            // Pour les créneaux en présentiel, on stocke les valeurs saisies
            const planningData = {
              medecinId: dto.medecinId,
              jour,
              debutHour: slot.debutHour,
              endHour: slot.endHour,
              type: slot.type,
              hopitalId: hopitalIdValue,
              salle: slot.salle,
              isOff: false,
              isActive: true,
              // Seulement pour IN_PERSON on stocke les valeurs
              consultationPrice: slot.type === PlanningType.IN_PERSON ? slot.consultationPrice : null,
              consultationDuration: slot.type === PlanningType.IN_PERSON ? slot.consultationDuration : null
            };
            
            if (existing) {
              const updated = await this.prisma.planning.update({
                where: { planningId: existing.planningId },
                data: { ...planningData, updatedAt: new Date() },
                include: { hopital: true }
              });
              results.updated.push(updated);
            } else {
              const created = await this.prisma.planning.create({
                data: planningData,
                include: { hopital: true }
              });
              results.created.push(created);
            }
          }
          
          // Supprimer les créneaux qui ne sont plus dans la nouvelle liste
          const existingSlots = await this.prisma.planning.findMany({
            where: { medecinId: dto.medecinId, jour, isOff: false }
          });
          
          const newSlotKeys = validSlots.map(s => {
            const hopitalIdVal = s.hopitalId || null;
            return `${s.debutHour}|${s.type}|${hopitalIdVal}`;
          });
          
          const toDelete = existingSlots.filter(slot => 
            !newSlotKeys.includes(`${slot.debutHour}|${slot.type}|${slot.hopitalId}`)
          );
          
          if (toDelete.length > 0) {
            await this.prisma.planning.deleteMany({
              where: { planningId: { in: toDelete.map(s => s.planningId) } }
            });
            results.deleted.push({ 
              jour, 
              count: toDelete.length,
              type: 'removed',
              slots: toDelete.map(s => ({ debutHour: s.debutHour, type: s.type }))
            });
          }
        }
      } catch (error) {
        this.logger.error(`Error processing ${jourPlanning.jour}: ${error.message}`);
        results.errors.push({
          jour: jourPlanning.jour,
          error: error.message
        });
      }
    }

    // Construire le message de résultat
    let message = `Plannings traités: ${results.created.length} créé(s), ${results.updated.length} mis à jour, ${results.deleted.length} supprimé(s)`;
    if (results.errors.length > 0) {
      message += `, ${results.errors.length} erreur(s)`;
    }
    
    return {
      message,
      messageE: `Plannings processed: ${results.created.length} created, ${results.updated.length} updated, ${results.deleted.length} deleted${results.errors.length > 0 ? `, ${results.errors.length} error(s)` : ''}`,
      data: results
    };
  }

  /** Mettre à jour le statut OFF d'un jour */
  async updateJourStatus(medecinId: number, dto: UpdateJourStatusDto) {
    const medecin = await this.prisma.user.findUnique({
      where: { userId: medecinId, userType: UserType.MEDECIN }
    });

    if (!medecin) {
      throw new NotFoundException({
        message: `Médecin avec ID ${medecinId} introuvable`,
        messageE: `Doctor with ID ${medecinId} not found`
      });
    }

    if (dto.isOff) {
      await this.prisma.planning.deleteMany({
        where: { medecinId, jour: dto.jour, isOff: false }
      });

      const existingOff = await this.prisma.planning.findFirst({
        where: { medecinId, jour: dto.jour, isOff: true }
      });

      if (existingOff) {
        const updated = await this.prisma.planning.update({
          where: { planningId: existingOff.planningId },
          data: { isActive: true, updatedAt: new Date() }
        });
        return {
          message: `Le ${dto.jour} a été marqué comme OFF`,
          messageE: `${dto.jour} has been marked as OFF`,
          data: updated
        };
      } else {
        const offRecord = await this.prisma.planning.create({
          data: {
            medecinId,
            jour: dto.jour,
            debutHour: '00:00:00',
            endHour: '00:00:00',
            type: PlanningType.ONLINE,
            hopitalId: null,
            isOff: true,
            isActive: true,
            consultationPrice: null,
            consultationDuration: null
          }
        });
        return {
          message: `Le ${dto.jour} a été marqué comme OFF`,
          messageE: `${dto.jour} has been marked as OFF`,
          data: offRecord
        };
      }
    } else {
      await this.prisma.planning.deleteMany({
        where: { medecinId, jour: dto.jour, isOff: true }
      });

      return {
        message: `Le ${dto.jour} n'est plus marqué comme OFF`,
        messageE: `${dto.jour} is no longer marked as OFF`,
        data: { medecinId, jour: dto.jour, isOff: false }
      };
    }
  }

  /** Récupérer tous les plannings d'un médecin groupés par jour */
  async findByMedecin(medecinId: number) {
    const medecin = await this.getMedecinWithSpeciality(medecinId);
    
    // Ici medecin.speciality n'est pas null grâce à getMedecinWithSpeciality
    const speciality = medecin.speciality!;

    const plannings = await this.prisma.planning.findMany({
      where: { medecinId, isActive: true },
      include: { hopital: true },
      orderBy: [
        { jour: 'asc' },
        { debutHour: 'asc' }
      ]
    });

    const joursOrder = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
    const grouped: Record<string, any> = {};

    for (const jour of joursOrder) {
      const jourPlannings = plannings.filter(p => p.jour === jour);
      
      const offRecord = jourPlannings.find(p => p.isOff === true);
      const normalSlots = jourPlannings.filter(p => p.isOff === false);
      
      if (offRecord && normalSlots.length === 0) {
        grouped[jour] = { isOff: true, slots: [] };
      } else {
        grouped[jour] = {
          isOff: false,
          slots: normalSlots.map(p => ({
            planningId: p.planningId,
            debutHour: p.debutHour,
            endHour: p.endHour,
            type: p.type,
            hopitalId: p.hopitalId,
            hopitalName: p.hopital?.firstName,
            hopitalAddress: p.hopital?.address,
            salle: p.salle,
            consultationPrice: p.consultationPrice ? Number(p.consultationPrice) : null,
            consultationDuration: p.consultationDuration
          }))
        };
      }
    }

    return {
      medecinId,
      medecinName: `${medecin.firstName} ${medecin.lastName}`,
      defaultOnlinePrice: Number(speciality.consultationPrice),
      defaultOnlineDuration: speciality.consultationDuration,
      plannings: grouped
    };
  }

  /** Récupérer les créneaux disponibles */
  async getSlots(dto: GetSlotsDto) {
    this.logger.log(`Getting slots for doctor ${dto.medecinId} on ${dto.date}`);
    
    const medecinId = Number(dto.medecinId);
    if (isNaN(medecinId)) {
      throw new BadRequestException({
        message: 'medecinId doit être un entier valide',
        messageE: 'medecinId must be a valid integer'
      });
    }

    const medecin = await this.getMedecinWithSpeciality(medecinId);
    
    // Ici medecin.speciality n'est pas null grâce à getMedecinWithSpeciality
    const speciality = medecin.speciality!;
    const consultationDurationDefault = speciality.consultationDuration;
    const consultationPriceDefault = Number(speciality.consultationPrice);
    
    const jour = this.getJourFromDate(dto.date);

    // Vérifier si le jour est OFF
    const offRecord = await this.prisma.planning.findFirst({
      where: {
        medecinId,
        jour,
        isOff: true,
        isActive: true
      }
    });

    if (offRecord) {
      return {
        available: false,
        message: `Le médecin est indisponible le ${jour} ${dto.date}`,
        messageE: `Doctor is unavailable on ${jour} ${dto.date}`,
        isOff: true,
        slots: []
      };
    }

    // Récupérer les plannings pour ce jour
    const whereCondition: any = {
      medecinId,
      jour,
      isActive: true,
      isOff: false
    };

    if (dto.type) {
      whereCondition.type = dto.type;
    }
    if (dto.hopitalId) {
      whereCondition.hopitalId = dto.hopitalId;
    }

    const plans = await this.prisma.planning.findMany({
      where: whereCondition,
      include: { hopital: true },
      orderBy: { debutHour: 'asc' }
    });

    if (plans.length === 0) {
      return {
        available: false,
        message: `Aucun créneau disponible pour ce médecin le ${dto.date}`,
        messageE: `No slots available for this doctor on ${dto.date}`,
        slots: []
      };
    }

    // Générer les créneaux avec pause de 5 minutes entre chaque
    const PAUSE_MINUTES = 5;
    const allSlots: Array<{
      start: string;
      end: string;
      type: PlanningType;
      hopitalId: number | null;
      hopitalName: string | undefined;
      hopitalAddress: string | null | undefined;
      salle: string | null;
      price: number;
      duration: number;
    }> = [];
    
    for (const plan of plans) {
      const startMin = this.timeToMinutes(plan.debutHour);
      const endMin = this.timeToMinutes(plan.endHour);
      
      let slotDuration: number;
      let slotPrice: number;
      
      // IMPORTANT: 
      // - ONLINE: on prend TOUJOURS les valeurs actuelles de la spécialité
      // - IN_PERSON: on utilise les valeurs stockées dans le planning
      if (plan.type === PlanningType.ONLINE) {
        slotDuration = consultationDurationDefault;
        slotPrice = consultationPriceDefault;
        this.logger.log(`Online slot: using default duration=${slotDuration}, price=${slotPrice}`);
      } else {
        // En présentiel: utiliser les valeurs stockées (converties en number)
        slotDuration = plan.consultationDuration || consultationDurationDefault;
        slotPrice = plan.consultationPrice ? Number(plan.consultationPrice) : consultationPriceDefault;
        this.logger.log(`In-person slot: using stored duration=${slotDuration}, price=${slotPrice}`);
      }
      
      const step = slotDuration + PAUSE_MINUTES;
      
      // Générer les créneaux
      for (let m = startMin; m + slotDuration <= endMin; m += step) {
        const start = this.minutesToTime(m);
        const end = this.minutesToTime(m + slotDuration);
        
        allSlots.push({
          start,
          end,
          type: plan.type,
          hopitalId: plan.hopitalId,
          hopitalName: plan.hopital?.firstName,
          hopitalAddress: plan.hopital?.address,
          salle: plan.salle,
          price: slotPrice,
          duration: slotDuration
        });
      }
    }

    this.logger.log(`Generated ${allSlots.length} total slots before filtering`);

    // Récupérer les réservations existantes pour cette date
    const existingReservations = await this.prisma.reservation.findMany({
      where: {
        medecinId,
        date: dto.date,
        status: { not: 'CANCELLED' }
      }
    });

    this.logger.log(`Found ${existingReservations.length} existing reservations`);

    // Filtrer les créneaux qui ne sont pas déjà réservés
    const availableSlots = allSlots.filter(slot => {
      const sMin = this.timeToMinutes(slot.start);
      const eMin = this.timeToMinutes(slot.end);
      
      const isOverlapping = existingReservations.some(r => {
        const rStart = this.timeToMinutes(r.hour);
        const rEnd = rStart + slot.duration;
        return sMin < rEnd && eMin > rStart;
      });
      
      return !isOverlapping;
    });

    this.logger.log(`Available slots after filtering: ${availableSlots.length}`);

    return {
      available: availableSlots.length > 0,
      date: dto.date,
      jour,
      isOff: false,
      slots: availableSlots
    };
  }

  /** Supprimer tous les plannings d'un médecin */
  async removeAll(medecinId: number) {
    const medecin = await this.prisma.user.findUnique({
      where: { userId: medecinId, userType: UserType.MEDECIN }
    });

    if (!medecin) {
      throw new NotFoundException({
        message: `Médecin avec ID ${medecinId} introuvable`,
        messageE: `Doctor with ID ${medecinId} not found`
      });
    }

    const reservationsFutures = await this.prisma.reservation.findMany({
      where: {
        medecinId,
        date: { gte: new Date().toISOString().split('T')[0] },
        status: { not: 'CANCELLED' }
      }
    });

    if (reservationsFutures.length > 0) {
      throw new ConflictException({
        message: `Impossible de supprimer : ${reservationsFutures.length} réservation(s) future(s) existent`,
        messageE: `Cannot delete: ${reservationsFutures.length} future reservation(s) exist`,
        reservations: reservationsFutures
      });
    }

    const deleted = await this.prisma.planning.deleteMany({
      where: { medecinId }
    });

    return {
      message: `${deleted.count} planning(s) supprimé(s) avec succès`,
      messageE: `${deleted.count} planning(s) deleted successfully`,
      count: deleted.count
    };
  }

  /** Supprimer un créneau spécifique */
  async removeSlot(planningId: number) {
    const planning = await this.prisma.planning.findUnique({
      where: { planningId },
      include: {
        medecin: {
          include: {
            reservationsM: {
              where: {
                date: { gte: new Date().toISOString().split('T')[0] },
                status: { not: 'CANCELLED' }
              }
            }
          }
        }
      }
    });

    if (!planning) {
      throw new NotFoundException({
        message: `Planning avec ID ${planningId} introuvable`,
        messageE: `Planning with ID ${planningId} not found`
      });
    }

    const conflictingReservations = planning.medecin.reservationsM.filter(r => {
      const rHour = r.hour;
      return rHour >= planning.debutHour && rHour < planning.endHour;
    });

    if (conflictingReservations.length > 0) {
      throw new ConflictException({
        message: `Impossible de supprimer : ${conflictingReservations.length} réservation(s) future(s) existent sur ce créneau`,
        messageE: `Cannot delete: ${conflictingReservations.length} future reservation(s) exist for this slot`
      });
    }

    return this.prisma.planning.delete({ where: { planningId } });
  }
}
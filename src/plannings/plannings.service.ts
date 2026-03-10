// import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
// import { PrismaService } from 'src/prisma/prisma.service';
// import { CreatePlanningDto } from './dto/create-planning.dto';
// import { UpdatePlanningDto } from './dto/update-planning.dto';
// import { GetSlotsDto } from './dto/get-slots.dto';
// import { UserType } from 'generated/prisma';

// @Injectable()
// export class PlanningsService {
//   constructor(private readonly prisma: PrismaService) {}

//     /** 1) Créer un planning (un seul par médecin) */
//   async create(dto: CreatePlanningDto) {
//     // Interdit si planning existant pour ce médecin
//     const exists = await this.prisma.planning.findFirst({
//       where: { medecinId: dto.medecinId },
//     });
//     if (exists) {
//       throw new ConflictException({
//         message: `Planning déjà défini pour le médecin ${dto.medecinId}, utilisez update.`,
//         messageE: `Planning already exists for doctor ${dto.medecinId}, please update.`,
//       });
//     }
//     // Création
//     return this.prisma.planning.create({ data: dto });
//   }

//   /** 2) Mettre à jour un planning existant */
//   async update(medecinId: number, dto: UpdatePlanningDto) {
//     const plan = await this.prisma.planning.findFirst({
//       where: { medecinId },
//     });
//     if (!plan) {
//       throw new NotFoundException({
//         message: `Aucun planning pour le médecin ${medecinId}.`,
//         messageE: `No planning found for doctor ${medecinId}.`,
//       });
//     }
//     return this.prisma.planning.update({
//       where: { planningId: plan.planningId },
//       data: dto,
//     });
//   }
//   /** 3) Lister les créneaux disponibles pour un médecin un jour donné */
// async getSlots(dto: GetSlotsDto): Promise<{
//     available: boolean;
//     message?: string;
//     messageE?: string;
//     slots: { start: string; end: string }[];
//   }> {
//     // 1) Forcer medecinId en number
//     const medecinId = Number(dto.medecinId);
//     if (isNaN(medecinId)) {
//       throw new BadRequestException({
//         message: 'medecinId doit être un entier valide.',
//         messageE: 'medecinId must be a valid integer.',
//       });
//     }
//     const date = dto.date;  // 'YYYY-MM-DD'

//     // 2) Vérifier que c’est bien un médecin et récupérer sa spécialité
//     const med = await this.prisma.user.findUnique({
//       where: { userId: medecinId },
//       include: { speciality: true },
//     });
//     if (!med || med.userType !== UserType.MEDECIN || !med.speciality) {
//       throw new NotFoundException({
//         message: `Médecin ${medecinId} introuvable.`,
//         messageE: `Doctor ${medecinId} not found.`,
//       });
//     }
//     const duration = med.speciality.consultationDuration;
//     if (!duration || duration <= 0) {
//       throw new BadRequestException({
//         message: 'Durée de consultation invalide.',
//         messageE: 'Invalid consultation duration.',
//       });
//     }

//     // 3) Déterminer le jour de la semaine
//     const dt = new Date(date);
//     const jours = ['dimanche','lundi','mardi','mercredi','jeudi','vendredi','samedi'];
//     const jour = jours[dt.getDay()];

//     // 4) Récupérer le planning pour ce jour
//     const plan = await this.prisma.planning.findFirst({
//       where: { medecinId, [jour]: true },
//     });
//     if (!plan || plan.isClosed) {
//       return {
//         available: false,
//         message: `Médecin indisponible le ${jour}.`,
//         messageE: `Doctor is unavailable on ${jour}.`,
//         slots: [],
//       };
//     }

//     // 5) Générer les créneaux [start,end] sans inclure les 5 min de pause
//     const toMin = (h: string) => {
//       const [H, M] = h.split(':').map(Number);
//       return H * 60 + M;
//     };
//     const pad = (n: number) => n.toString().padStart(2, '0');

//     const startMin = toMin(plan.debutHour);
//     const endMin   = toMin(plan.endHour);
//     const pause    = 5;                  // minutes de pause
//     const step     = duration + pause;   // intervalle de début de créneaux

//     const candidates: { start: string; end: string }[] = [];
//     for (let m = startMin; m + duration <= endMin; m += step) {
//       const sH = Math.floor(m / 60), sM = m % 60;
//       const e = m + duration;
//       const eH = Math.floor(e / 60), eM = e % 60;
//       candidates.push({
//         start: `${pad(sH)}:${pad(sM)}:00`,
//         end:   `${pad(eH)}:${pad(eM)}:00`,
//       });
//     }

//     // 6) Filtrer les créneaux déjà réservés
//     const existing = await this.prisma.reservation.findMany({
//       where: {
//         medecinId,
//         date,
//       },
//     });
//     const slots = candidates.filter(slot => {
//       const sMin = toMin(slot.start);
//       const eMin = toMin(slot.end);
//       return !existing.some(r => {
//         const rStart = toMin(r.hour);
//         const rEnd   = rStart + duration;
//         return sMin < rEnd && eMin > rStart;
//       });
//     });

//     return {
//       available: true,
//       slots,
//     };
//   }

// }


// src/planning/plannings.service.ts
import { 
  BadRequestException, 
  ConflictException, 
  Injectable, 
  NotFoundException 
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePlanningDto } from './dto/create-planning.dto';
import { UpdatePlanningDto } from './dto/update-planning.dto';
import { GetSlotsDto } from './dto/get-slots.dto';
import { UserType } from 'generated/prisma';

@Injectable()
export class PlanningsService {
  constructor(private readonly prisma: PrismaService) {}

  /* ========== UTILS ========== */
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

  /** 1) Créer un planning (ou mettre à jour s'il existe déjà) */
  async create(dto: CreatePlanningDto) {
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

    // Vérifier si un planning existe déjà
    const existing = await this.prisma.planning.findFirst({
      where: { medecinId: dto.medecinId },
    });
    
    if (existing) {
      // Si le planning existe, on fait une mise à jour
      return this.prisma.planning.update({
        where: { planningId: existing.planningId },
        data: dto,
      });
    }
    
    // Sinon, création d'un nouveau planning
    return this.prisma.planning.create({ 
      data: dto,
      include: { medecin: true }
    });
  }

  /** 2) Mettre à jour un planning existant */
  async update(medecinId: number, dto: UpdatePlanningDto) {
    const plan = await this.prisma.planning.findFirst({
      where: { medecinId },
    });
    
    if (!plan) {
      throw new NotFoundException({
        message: `Aucun planning pour le médecin ${medecinId}.`,
        messageE: `No planning found for doctor ${medecinId}.`,
      });
    }
    
    return this.prisma.planning.update({
      where: { planningId: plan.planningId },
      data: dto,
    });
  }

  /** 3) Lister les créneaux disponibles pour un médecin un jour donné */
  async getSlots(dto: GetSlotsDto): Promise<{
    available: boolean;
    message?: string;
    messageE?: string;
    slots: { start: string; end: string }[];
  }> {
    // 1) Forcer medecinId en number
    const medecinId = Number(dto.medecinId);
    if (isNaN(medecinId)) {
      throw new BadRequestException({
        message: 'medecinId doit être un entier valide.',
        messageE: 'medecinId must be a valid integer.',
      });
    }
    const date = dto.date;  // 'YYYY-MM-DD'

    // 2) Vérifier que c’est bien un médecin et récupérer sa spécialité
    const med = await this.prisma.user.findUnique({
      where: { userId: medecinId },
      include: { speciality: true },
    });
    if (!med || med.userType !== UserType.MEDECIN || !med.speciality) {
      throw new NotFoundException({
        message: `Médecin ${medecinId} introuvable.`,
        messageE: `Doctor ${medecinId} not found.`,
      });
    }
    const duration = med.speciality.consultationDuration;
    if (!duration || duration <= 0) {
      throw new BadRequestException({
        message: 'Durée de consultation invalide.',
        messageE: 'Invalid consultation duration.',
      });
    }

    // 3) Déterminer le jour de la semaine
    const dt = new Date(date);
    const jours = ['dimanche','lundi','mardi','mercredi','jeudi','vendredi','samedi'];
    const jour = jours[dt.getDay()];

    // 4) Récupérer le planning pour ce jour
    const plan = await this.prisma.planning.findFirst({
      where: { medecinId, [jour]: true },
    });
    if (!plan || plan.isClosed) {
      return {
        available: false,
        message: `Médecin indisponible le ${jour}.`,
        messageE: `Doctor is unavailable on ${jour}.`,
        slots: [],
      };
    }

    // 5) Générer les créneaux [start,end] sans inclure les 5 min de pause
    const toMin = (h: string) => {
      const [H, M] = h.split(':').map(Number);
      return H * 60 + M;
    };
    const pad = (n: number) => n.toString().padStart(2, '0');

    const startMin = toMin(plan.debutHour);
    const endMin   = toMin(plan.endHour);
    const pause    = 5;                  // minutes de pause
    const step     = duration + pause;   // intervalle de début de créneaux

    const candidates: { start: string; end: string }[] = [];
    for (let m = startMin; m + duration <= endMin; m += step) {
      const sH = Math.floor(m / 60), sM = m % 60;
      const e = m + duration;
      const eH = Math.floor(e / 60), eM = e % 60;
      candidates.push({
        start: `${pad(sH)}:${pad(sM)}:00`,
        end:   `${pad(eH)}:${pad(eM)}:00`,
      });
    }

    // 6) Filtrer les créneaux déjà réservés
    const existing = await this.prisma.reservation.findMany({
      where: {
        medecinId,
        date,
      },
    });
    const slots = candidates.filter(slot => {
      const sMin = toMin(slot.start);
      const eMin = toMin(slot.end);
      return !existing.some(r => {
        const rStart = toMin(r.hour);
        const rEnd   = rStart + duration;
        return sMin < rEnd && eMin > rStart;
      });
    });

    return {
      available: true,
      slots,
    };
  }

  /** 4) Récupérer le planning d'un médecin */
  async findByMedecin(medecinId: number) {
    const plan = await this.prisma.planning.findFirst({
      where: { medecinId },
      include: { medecin: true }
    });

    if (!plan) {
      throw new NotFoundException({
        message: `Aucun planning pour le médecin ${medecinId}`,
        messageE: `No planning found for doctor ${medecinId}`
      });
    }

    return plan;
  }

  /** 5) Récupérer tous les plannings (pour admin) */
  async findAll() {
    return this.prisma.planning.findMany({
      include: {
        medecin: {
          select: {
            userId: true,
            firstName: true,
            lastName: true,
            speciality: true
          }
        }
      }
    });
  }

  /** 6) Supprimer un planning (avec vérification) */
  async remove(medecinId: number) {
    const plan = await this.prisma.planning.findFirst({
      where: { medecinId },
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

    if (!plan) {
      throw new NotFoundException({
        message: `Aucun planning pour le médecin ${medecinId}`,
        messageE: `No planning found for doctor ${medecinId}`
      });
    }

    // Vérifier s'il y a des réservations futures
    if (plan.medecin.reservationsM.length > 0) {
      throw new ConflictException({
        message: `Impossible de supprimer : ${plan.medecin.reservationsM.length} réservation(s) future(s) existent`,
        messageE: `Cannot delete: ${plan.medecin.reservationsM.length} future reservation(s) exist`,
        reservations: plan.medecin.reservationsM
      });
    }

    return this.prisma.planning.delete({
      where: { planningId: plan.planningId }
    });
  }

  /** 7) Vérifier la disponibilité d'un créneau spécifique */
  async checkSlotAvailability(
    medecinId: number,
    date: string,
    hour: string
  ): Promise<boolean> {
    const medecin = await this.prisma.user.findUnique({
      where: { userId: medecinId },
      include: { speciality: true }
    });

    if (!medecin?.speciality) return false;

    const duration = medecin.speciality.consultationDuration;
    const jour = this.getJourFromDate(date);

    // Vérifier le planning
    const plan = await this.prisma.planning.findFirst({
      where: { medecinId, [jour]: true, isClosed: false }
    });

    if (!plan) return false;

    // Vérifier que l'heure est dans la plage
    const slotTime = this.timeToMinutes(hour);
    const startTime = this.timeToMinutes(plan.debutHour);
    const endTime = this.timeToMinutes(plan.endHour);

    if (slotTime < startTime || slotTime + duration > endTime) {
      return false;
    }

    // Vérifier les réservations existantes
    const existing = await this.prisma.reservation.findFirst({
      where: {
        medecinId,
        date,
        hour,
        status: { not: 'CANCELLED' }
      }
    });

    return !existing;
  }
}
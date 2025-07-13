import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePlanningDto } from './dto/create-planning.dto';
import { UpdatePlanningDto } from './dto/update-planning.dto';
import { GetSlotsDto } from './dto/get-slots.dto';
import { UserType } from 'generated/prisma';

@Injectable()
export class PlanningsService {
  constructor(private readonly prisma: PrismaService) {}

    /** 1) Créer un planning (un seul par médecin) */
  async create(dto: CreatePlanningDto) {
    // Interdit si planning existant pour ce médecin
    const exists = await this.prisma.planning.findFirst({
      where: { medecinId: dto.medecinId },
    });
    if (exists) {
      throw new ConflictException({
        message: `Planning déjà défini pour le médecin ${dto.medecinId}, utilisez update.`,
        messageE: `Planning already exists for doctor ${dto.medecinId}, please update.`,
      });
    }
    // Création
    return this.prisma.planning.create({ data: dto });
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

}



// ===== src/suivis/suivis.service.ts =====
import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateSuiviDto } from './dto/create-suivi.dto';
import { UpdateSuiviDto } from './dto/update-suivi.dto';
import { QuerySuiviDto } from './dto/query-suivi.dto';
import { Prisma } from 'generated/prisma';

@Injectable()
export class SuivisService {
  constructor(private readonly prisma: PrismaService) {}

  // Helpers
  private toMinutes(h: string) {
    const [H, M] = h.split(':').map(Number);
    return H * 60 + M;
  }
  private isValidDate(s: string) { return /^\d{4}-\d{2}-\d{2}$/.test(s); }
  private isValidHour(s: string) { return /^\d{2}:\d{2}$/.test(s); }

  /** 1) GET ALL avec filtres & pagination */
 async findAll(query: QuerySuiviDto) {
  try {
    const page = query.page ?? 1;
    const limit = query.limit ? Number(query.limit) : 10; // Ensure limit is a number
    if (page < 1 || limit < 1) {
      throw new BadRequestException({
        message: 'Page et limit doivent être >= 1.',
        messageE: 'Page and limit must be >= 1.',
      });
    }
    const skip = (page - 1) * limit;

    const where: Prisma.SuiviWhereInput = {};
    if (query.patientId) where.patientId = query.patientId;
    if (query.date) where.date = query.date; // ISO string YYYY-MM-DD -> tri lexicographique OK
    if (typeof query.isTaken === 'boolean') where.isTaken = query.isTaken;
    if (query.q) where.nomMedicament = { contains: query.q } as any; // MySQL est souvent insensitive

    const [items, total] = await this.prisma.$transaction([
      this.prisma.suivi.findMany({
        where,
        skip,
        take: limit, // Now this is guaranteed to be a number
        orderBy: [{ date: 'asc' }, { heure: 'asc' }],
        include: { ordonance: true },
      }),
      this.prisma.suivi.count({ where }),
    ]);

    return {
      message: 'Suivis récupérés avec succès.',
      messageE: 'Medication logs fetched successfully.',
      items,
      meta: { total, page, limit, lastPage: Math.ceil(total / limit) },
    };
  } catch (error) {
    if (error instanceof BadRequestException) throw error;
    throw new BadRequestException({
      message: `Erreur récupération : ${error.message}`,
      messageE: `Fetch error: ${error.message}`,
    });
  }
}

  /** 2) GET ONE (avec détails patient, ordonnance) */
  async findOne(id: number) {
    const row = await this.prisma.suivi.findUnique({
      where: { suiviId: id },
      include: {
        patient: {
          select: {
            userId: true, firstName: true, lastName: true, phone: true,
            email: true, userType: true, isVerified: true, isBlock: true,
          },
        },
        ordonance: true,
      },
    });
    if (!row) {
      throw new NotFoundException({
        message: `Suivi ${id} introuvable.`,
        messageE: `Suivi ${id} not found.`,
      });
    }
    return {
      message: 'Suivi récupéré avec succès.',
      messageE: 'Medication log fetched successfully.',
      item: row,
    };
  }

  /** 3) CREATE EN BATCH (days x heures) avec skipDuplicates */
  async create(dto: CreateSuiviDto) {
    // validations basiques
    if (!this.isValidDate(dto.date)) {
      throw new BadRequestException({
        message: 'Date invalide (format YYYY-MM-DD).',
        messageE: 'Invalid date format (YYYY-MM-DD).',
      });
    }
    if (!Array.isArray(dto.heures) || dto.heures.length === 0 || !dto.heures.every(h=>this.isValidHour(h))) {
      throw new BadRequestException({
        message: 'Heures invalides (HH:mm).',
        messageE: 'Invalid hours (HH:mm).',
      });
    }

    // vérifs patient & ordonnance
    const patient = await this.prisma.user.findUnique({ where: { userId: dto.patientId } });
    if (!patient) {
      throw new NotFoundException({
        message: `Patient ${dto.patientId} introuvable.`,
        messageE: `Patient ${dto.patientId} not found.`,
      });
    }
    if (dto.ordonanceId) {
      const ord = await this.prisma.ordonance.findUnique({ where: { ordonanceId: dto.ordonanceId } });
      if (!ord) {
        throw new NotFoundException({
          message: `Ordonnance ${dto.ordonanceId} introuvable.`,
          messageE: `Ordonance ${dto.ordonanceId} not found.`,
        });
      }
      if (ord.patientId !== dto.patientId) {
        throw new BadRequestException({
          message: `L'ordonnance n'appartient pas à ce patient.`,
          messageE: `The prescription does not belong to this patient.`,
        });
      }
    }

    // Générer toutes les occurrences
    const baseDate = new Date(`${dto.date}T00:00:00`);
    const rows: Prisma.SuiviCreateManyInput[] = [];
    for (let d = 0; d < dto.days; d++) {
      const day = new Date(baseDate);
      day.setDate(day.getDate() + d);
      const y = day.getFullYear();
      const m = String(day.getMonth()+1).padStart(2,'0');
      const dayStr = String(day.getDate()).padStart(2,'0');
      const dateStr = `${y}-${m}-${dayStr}`;
      for (const h of dto.heures) {
        rows.push({
          patientId: dto.patientId,
          nomMedicament: dto.nomMedicament,
          dosage: dto.dosage,
          frequence: dto.frequence,
          date: dateStr,
          heure: h,
          stock: dto.stock,
          ordonanceId: dto.ordonanceId,
          isTaken: false,
        });
      }
    }

    try {
      const result = await this.prisma.suivi.createMany({ data: rows, skipDuplicates: true });
      // Récupérer les lignes créées pour les renvoyer (best effort)
      const firstDate = rows[0].date!;
      const lastDate = rows[rows.length-1].date!;
      const created = await this.prisma.suivi.findMany({
        where: {
          patientId: dto.patientId,
          date: { gte: firstDate, lte: lastDate },
          nomMedicament: dto.nomMedicament,
        },
        orderBy: [{ date: 'asc' }, { heure: 'asc' }],
      });
      return {
        message: `Création de ${result.count} prises (doublons ignorés).`,
        messageE: `Created ${result.count} doses (duplicates skipped).`,
        items: created,
      };
    } catch (err) {
      if ((err as any).code === 'P2002') {
        throw new ConflictException({
          message: 'Conflit d\'unicité sur (patientId, date, heure, nomMedicament).',
          messageE: 'Uniqueness conflict on (patientId, date, heure, nomMedicament).',
        });
      }
      throw new BadRequestException({
        message: `Erreur création : ${(err as any).message}`,
        messageE: `Create error: ${(err as any).message}`,
      });
    }
  }

  /** 4) UPDATE 1 ligne */
  async update(id: number, dto: UpdateSuiviDto) {
    try {
      const exists = await this.prisma.suivi.findUnique({ where: { suiviId: id } });
      if (!exists) {
        throw new NotFoundException({
          message: `Suivi ${id} introuvable.`,
          messageE: `Suivi ${id} not found.`,
        });
      }
      if (dto.date && !this.isValidDate(dto.date)) {
        throw new BadRequestException({
          message: 'Date invalide (YYYY-MM-DD).',
          messageE: 'Invalid date format (YYYY-MM-DD).',
        });
      }
      if (dto.heure && !this.isValidHour(dto.heure)) {
        throw new BadRequestException({
          message: 'Heure invalide (HH:mm).',
          messageE: 'Invalid hour format (HH:mm).',
        });
      }
      const updated = await this.prisma.suivi.update({
        where: { suiviId: id },
        data: dto,
      });
      return {
        message: 'Suivi mis à jour avec succès.',
        messageE: 'Medication log updated successfully.',
        item: updated,
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
      if ((error as any).code === 'P2002') {
        throw new ConflictException({
          message: 'Conflit d\'unicité après mise à jour.',
          messageE: 'Uniqueness conflict after update.',
        });
      }
      throw new BadRequestException({
        message: `Erreur mise à jour : ${error.message}`,
        messageE: `Update error: ${error.message}`,
      });
    }
  }

  /** 5) TOGGLE isTaken (+ décrément de stock si défini) */
  async toggle(id: number) {
    const row = await this.prisma.suivi.findUnique({ where: { suiviId: id } });
    if (!row) {
      throw new NotFoundException({
        message: `Suivi ${id} introuvable.`,
        messageE: `Suivi ${id} not found.`,
      });
    }
    const next = !row.isTaken;
    const data: any = { isTaken: next };
    if (next && typeof row.stock === 'number' && row.stock > 0) {
      data.stock = { decrement: 1 } as any;
    }
    const updated = await this.prisma.suivi.update({ where: { suiviId: id }, data });
    return {
      message: `Statut de prise mis à jour (${next ? 'pris' : 'non pris'}).`,
      messageE: `Intake status updated (${next ? 'taken' : 'not taken'}).`,
      item: updated,
    };
  }

  /** 6) DELETE */
  async remove(id: number) {
    const row = await this.prisma.suivi.findUnique({ where: { suiviId: id } });
    if (!row) {
      throw new NotFoundException({
        message: `Suivi ${id} introuvable.`,
        messageE: `Suivi ${id} not found.`,
      });
    }
    await this.prisma.suivi.delete({ where: { suiviId: id } });
    return {
      message: 'Suivi supprimé avec succès.',
      messageE: 'Medication log deleted successfully.',
    };
  }
}


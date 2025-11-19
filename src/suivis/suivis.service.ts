import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateSuiviDto } from './dto/create-suivi.dto';
import { UpdateSuiviDto } from './dto/update-suivi.dto';
import { QuerySuiviDto } from './dto/query-suivi.dto';
import { Prisma } from 'generated/prisma';

@Injectable()
export class SuivisService {
  constructor(private readonly prisma: PrismaService) {}

  /** 1) GET ALL avec filtres & pagination */
  async findAll(query: QuerySuiviDto) {
    try {
      const page = query.page ?? 1;
      const limit = query.limit ? Number(query.limit) : 10;
      if (page < 1 || limit < 1) {
        throw new BadRequestException({
          message: 'Page et limit doivent être >= 1.',
          messageE: 'Page and limit must be >= 1.',
        });
      }
      const skip = (page - 1) * limit;

      const where: Prisma.SuiviWhereInput = {};
      if (query.patientId) where.patientId = query.patientId;
      if (query.ordonanceId) where.ordonanceId = query.ordonanceId;
      if (query.startDate) where.startDate = { gte: new Date(query.startDate) };
      if (query.endDate) where.endDate = { lte: new Date(query.endDate) };
      if (typeof query.isActive === 'boolean') where.isActive = query.isActive;
      
      if (query.q) {
        where.OR = [
          { name: { contains: query.q } },
          { dosage: { contains: query.q } },
          { posologie: { contains: query.q } },
        ];
      }

      const [items, total] = await this.prisma.$transaction([
        this.prisma.suivi.findMany({
          where,
          skip,
          take: limit,
          orderBy: [{ startDate: 'asc' }, { name: 'asc' }],
          include: { 
            // ordonnance: true,
            patient: {
              select: {
                userId: true, firstName: true, lastName: true, phone: true,
                email: true, userType: true,
              },
            }
          },
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

  /** 2) GET ONE */
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
        ordonnance: true,
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

  /** 3) CREATE */
  async create(dto: CreateSuiviDto) {
    // Validation des dates
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);
    
    if (startDate > endDate) {
      throw new BadRequestException({
        message: 'La date de début doit être avant la date de fin.',
        messageE: 'Start date must be before end date.',
      });
    }

    // Vérification du patient
    const patient = await this.prisma.user.findUnique({ where: { userId: dto.patientId } });
    if (!patient) {
      throw new NotFoundException({
        message: `Patient ${dto.patientId} introuvable.`,
        messageE: `Patient ${dto.patientId} not found.`,
      });
    }

    // Vérification de l'ordonnance si fournie
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

    try {
      const created = await this.prisma.suivi.create({
        data: {
          patientId: dto.patientId,
          ordonanceId: dto.ordonanceId,
          name: dto.name,
          dosage: dto.dosage,
          posologie: dto.posologie,
          forme: dto.forme,
          voie: dto.voie,
          instructions: dto.instructions,
          startDate: startDate,
          endDate: endDate,
          frequency: dto.frequency as unknown as Prisma.InputJsonValue,
          notificationTimes: dto.notificationTimes,
          isActive: dto.isActive,
        },
      });

      return {
        message: 'Suivi créé avec succès.',
        messageE: 'Medication log created successfully.',
        item: created,
      };
    } catch (err) {
      throw new BadRequestException({
        message: `Erreur création : ${(err as any).message}`,
        messageE: `Create error: ${(err as any).message}`,
      });
    }
  }

  /** 4) Créer des suivis à partir d'un traitement d'ordonnance */
  async createFromTreatment(treatment: any, ordonanceId: number, patientId: number) {
    try {
      const created = await this.prisma.suivi.create({
        data: {
          patientId,
          ordonanceId,
          name: treatment.name,
          dosage: treatment.dosage,
          posologie: treatment.posologie,
          forme: treatment.forme,
          voie: treatment.voie,
          instructions: treatment.instructions,
          startDate: new Date(treatment.startDate),
          endDate: new Date(treatment.endDate),
          frequency: treatment.frequency,
          notificationTimes: treatment.notificationTimes,
          isActive: treatment.isActive,
        },
      });
      return created;
    } catch (error) {
      console.error('Erreur création suivi depuis traitement:', error);
      throw error;
    }
  }

  /** 5) UPDATE */
  async update(id: number, dto: UpdateSuiviDto) {
    try {
      const exists = await this.prisma.suivi.findUnique({ where: { suiviId: id } });
      if (!exists) {
        throw new NotFoundException({
          message: `Suivi ${id} introuvable.`,
          messageE: `Suivi ${id} not found.`,
        });
      }

      // Validation des dates si fournies
      if (dto.startDate && dto.endDate) {
        const startDate = new Date(dto.startDate);
        const endDate = new Date(dto.endDate);
        if (startDate > endDate) {
          throw new BadRequestException({
            message: 'La date de début doit être avant la date de fin.',
            messageE: 'Start date must be before end date.',
          });
        }
      }

      const data: any = {};
      if (dto.name !== undefined) data.name = dto.name;
      if (dto.dosage !== undefined) data.dosage = dto.dosage;
      if (dto.posologie !== undefined) data.posologie = dto.posologie;
      if (dto.forme !== undefined) data.forme = dto.forme;
      if (dto.voie !== undefined) data.voie = dto.voie;
      if (dto.instructions !== undefined) data.instructions = dto.instructions;
      if (dto.startDate !== undefined) data.startDate = new Date(dto.startDate);
      if (dto.endDate !== undefined) data.endDate = new Date(dto.endDate);
      if (dto.frequency !== undefined) data.frequency = dto.frequency;
      if (dto.notificationTimes !== undefined) data.notificationTimes = dto.notificationTimes;
      if (dto.isActive !== undefined) data.isActive = dto.isActive;
      if (dto.ordonanceId !== undefined) data.ordonanceId = dto.ordonanceId;

      const updated = await this.prisma.suivi.update({
        where: { suiviId: id },
        data,
      });

      return {
        message: 'Suivi mis à jour avec succès.',
        messageE: 'Medication log updated successfully.',
        item: updated,
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
      throw new BadRequestException({
        message: `Erreur mise à jour : ${error.message}`,
        messageE: `Update error: ${error.message}`,
      });
    }
  }

  //   async toggle(id: number) {
  //   const row = await this.prisma.suivi.findUnique({ where: { suiviId: id }, include: { ordonance: true, patient: true } });
  //   if (!row) throw new NotFoundException({ message: `Suivi ${id} introuvable.` });
  //   const next = !row.isTaken;
  //   const data: any = { isTaken: next };
  //   if (next && typeof row.stock === 'number' && row.stock > 0) data.stock = { decrement: 1 } as any;
  //   const updated = await this.prisma.suivi.update({ where: { suiviId: id }, data, include: { ordonance: true, patient: true } });
  //   const traitements = updated.ordonance ? this.normalizeTraitementsArray(updated.ordonance.traitement as any, { createdAt: updated.ordonance.createdAt, updatedAt: updated.ordonance.updatedAt }) : [];
  //   return { message: `Statut mis à jour.`, item: { ...updated, traitements } };
  // }
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

  /** 7) Supprimer les suivis d'une ordonnance */
  async removeByOrdonance(ordonanceId: number) {
    await this.prisma.suivi.deleteMany({
      where: { ordonanceId }
    });
  }
}
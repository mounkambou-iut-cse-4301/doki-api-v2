import { ConflictException, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateOrdonanceDto } from './dto/create-ordonance.dto';
import { uploadImageToCloudinary } from 'src/utils/cloudinary';
import { UpdateOrdonanceDto } from './dto/update-ordonance.dto';
import { Ordonance, Prisma, Reservation, User } from 'generated/prisma';
import { OrdonanceFilterDto } from './dto/ordonance-filter.dto';
import { bi, isValidExpoToken, sendExpoPush } from 'src/utils/expo-push';
import { SuivisService } from 'src/suivis/suivis.service';

@Injectable()
export class OrdonancesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly suivisService: SuivisService
  ) {}

  private async notify(userId: number, titleFr: string, titleEn: string, msgFr: string, msgEn: string) {
    return this.prisma.notification.create({
      data: { userId, title: bi(titleFr, titleEn), message: bi(msgFr, msgEn), isRead: false },
    });
  }

  async create(dto: CreateOrdonanceDto): Promise<Ordonance> {
    const exists = await this.prisma.ordonance.findFirst({ where: { reservationId: dto.reservationId } });
    if (exists) throw new ConflictException('Une ordonnance existe déjà pour cette réservation.');

    const [med, pat, resa] = await Promise.all([
      this.prisma.user.findUnique({ where: { userId: dto.medecinId } }),
      this.prisma.user.findUnique({ where: { userId: dto.patientId } }),
      this.prisma.reservation.findUnique({ where: { reservationId: dto.reservationId } }),
    ]);
    if (!med) throw new NotFoundException("Médecin introuvable");
    if (!pat) throw new NotFoundException("Patient introuvable");
    if (!resa) throw new NotFoundException("Réservation introuvable");

    // Validation des traitements - PLUS SOUPLE
    if (!Array.isArray(dto.traitement) || dto.traitement.length === 0) {
      throw new BadRequestException('Au moins un traitement est requis.');
    }

    for (const traitement of dto.traitement) {
      if (!this.isValidTreatment(traitement)) {
        console.log('Traitement invalide:', traitement);
        throw new BadRequestException(`Format de traitement invalide: ${JSON.stringify(traitement)}`);
      }
    }

    const urls: string[] = [];
    if (dto.images?.length) {
      for (const file of dto.images) {
        urls.push(await uploadImageToCloudinary(file, 'ordonances'));
      }
    }

    // Création de l'ordonnance
    const ord = await this.prisma.ordonance.create({
      data: {
        reservation: { connect: { reservationId: dto.reservationId } },
        medecin: { connect: { userId: dto.medecinId } },
        patient: { connect: { userId: dto.patientId } },
        name: dto.name ?? null,
        dureeTraitement: dto.dureeTraitement,
        traitement: dto.traitement as unknown as Prisma.InputJsonValue,
        comment: dto.comment,
        images: urls,
      },
    });

    // Création automatique des suivis pour chaque traitement
    for (const traitement of dto.traitement) {
      if (traitement.isActive) {
        try {
          await this.suivisService.createFromTreatment(
            traitement, 
            ord.ordonanceId, 
            ord.patientId
          );
        } catch (error) {
          console.error('Erreur création suivi:', error);
          // Continue même si un suivi échoue
        }
      }
    }

    // Notifications
    const titleFr = 'Nouvelle ordonnance';
    const titleEn = 'New prescription';
    const patientMsgFr = `Le Dr ${med.firstName} ${med.lastName} a émis une ordonnance${dto.name ? ` : ${dto.name}` : ''}. Les suivis de médicaments ont été programmés.`;
    const patientMsgEn = `Dr ${med.firstName} ${med.lastName} issued a prescription${dto.name ? `: ${dto.name}` : ''}. Medication schedules have been set up.`;

    const doctorMsgFr = `Ordonnance ${dto.name ? `"${dto.name}" ` : ''}créée pour ${pat.firstName} ${pat.lastName}.`;
    const doctorMsgEn = `Prescription ${dto.name ? `"${dto.name}" ` : ''}created for ${pat.firstName} ${pat.lastName}.`;

    void Promise.all([
      this.notify(pat.userId, titleFr, titleEn, patientMsgFr, patientMsgEn),
      this.notify(med.userId, titleFr, titleEn, doctorMsgFr, doctorMsgEn),
    ]).catch(() => void 0);

    // Push Expo
    if (isValidExpoToken(pat.expotoken)) {
      void sendExpoPush({
        to: pat.expotoken!,
        sound: 'default',
        title: bi(titleFr, titleEn),
        body: bi(patientMsgFr, patientMsgEn),
        data: { kind: 'ORDONANCE_NEW', ordonanceId: ord.ordonanceId, reservationId: ord.reservationId },
        priority: 'high',
      });
    }

    if (isValidExpoToken(med.expotoken)) {
      void sendExpoPush({
        to: med.expotoken!,
        sound: 'default',
        title: bi(titleFr, titleEn),
        body: bi(doctorMsgFr, doctorMsgEn),
        data: { kind: 'ORDONANCE_CREATED', ordonanceId: ord.ordonanceId, reservationId: ord.reservationId },
        priority: 'high',
      });
    }

    return ord;
  }

  private isValidTreatment(treatment: any): boolean {
    console.log(treatment);
    
    // Validation plus souple
    const requiredFields = ['name', 'dosage', 'forme', 'voie', 'posologie', 'instructions'];
    
    for (const field of requiredFields) {
      if (!treatment[field] || typeof treatment[field] !== 'string') {
        console.log(`Champ manquant ou invalide: ${field}`, treatment[field]);
        return false;
      }
    }

    // Validation des dates
    if (!treatment.startDate || !treatment.endDate) {
      console.log('Dates manquantes');
      return false;
    }

    // Validation de la fréquence
    if (!treatment.frequency || !treatment.frequency.type) {
      console.log('Fréquence manquante');
      return false;
    }

    // Validation des heures de notification
    if (!Array.isArray(treatment.notificationTimes) || treatment.notificationTimes.length === 0) {
      console.log('Heures de notification manquantes');
      return false;
    }

    // Validation du statut actif
    if (typeof treatment.isActive !== 'boolean') {
      console.log('Statut actif manquant');
      return false;
    }

    return true;
  }

  

  async findAll(filters: OrdonanceFilterDto) {
    const { medecinId, patientId, reservationId, createdAt, dureeTraitement, comment, page = 1, limit = 10, q } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.OrdonanceWhereInput = {
      ...(medecinId && { medecinId }),
      ...(patientId && { patientId }),
      ...(reservationId && { reservationId }),
      ...(createdAt && { createdAt: { gte: new Date(createdAt) } }),
      ...(dureeTraitement && { dureeTraitement: { contains: dureeTraitement } }),
      ...(comment && { comment: { contains: comment } }),
    };

    if (q && q.trim()) {
      const s = q.trim();
      if (!Array.isArray(where.AND)) {
        where.AND = where.AND ? [where.AND as Prisma.OrdonanceWhereInput] : [];
      }
      (where.AND as Prisma.OrdonanceWhereInput[]).push({
        OR: [
          { name:            { contains: s } },
          { dureeTraitement: { contains: s } },
          { comment:         { contains: s } },
          { medecin: { OR: [{ firstName: { contains: s } }, { lastName: { contains: s } }] } },
          { patient: { OR: [{ firstName: { contains: s } }, { lastName: { contains: s } }] } },
        ],
      });
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.ordonance.findMany({ 
        where, 
        skip, 
        take: limit, 
        orderBy: { createdAt: 'desc' },
        include: {
          medecin: { select: { userId: true, firstName: true, lastName: true } },
          patient: { select: { userId: true, firstName: true, lastName: true } },
          Suivi: { select: { suiviId: true, name: true, startDate: true, endDate: true, isActive: true } }
        }
      }),
      this.prisma.ordonance.count({ where }),
    ]);

    return { items, meta: { total, page, limit, lastPage: Math.ceil(total / limit) } };
  }

  async update(id: number, dto: UpdateOrdonanceDto): Promise<Ordonance> {
    const ord = await this.prisma.ordonance.findUnique({ where: { ordonanceId: id } });
    if (!ord) throw new NotFoundException('Ordonnance introuvable.');

    let urls = (ord.images as string[]) ?? [];
    if (dto.images) {
      urls = [];
      for (const file of dto.images) {
        urls.push(await uploadImageToCloudinary(file, 'ordonances'));
      }
    }

    const data: Prisma.OrdonanceUpdateInput = {
      name:            dto.name ?? ord.name,
      dureeTraitement: dto.dureeTraitement,
      traitement:      (dto.traitement ?? ord.traitement) as unknown as Prisma.InputJsonValue,
      comment:         dto.comment,
      images:          urls,
    };

    // Si les traitements sont mis à jour, recréer les suivis
    if (dto.traitement) {
      // Supprimer les anciens suivis
      await this.suivisService.removeByOrdonance(id);
      
      // Créer les nouveaux suivis
      for (const traitement of dto.traitement) {
        if (traitement.isActive) {
          await this.suivisService.createFromTreatment(
            traitement, 
            id, 
            ord.patientId
          );
        }
      }
    }

    return this.prisma.ordonance.update({ where: { ordonanceId: id }, data });
  }

  async findOne(id: number): Promise<Ordonance & { medecin: User; patient: User; reservation: Reservation; Suivi: any[] }> {
    const ord = await this.prisma.ordonance.findUnique({
      where: { ordonanceId: id },
      include: { 
        medecin: true, 
        patient: true, 
        reservation: true,
        Suivi: {
          orderBy: [{ startDate: 'asc' }, { name: 'asc' }],
        }
      },
    });
    if (!ord) throw new NotFoundException('Ordonnance introuvable.');
    return ord;
  }
}
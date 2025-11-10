// import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
// import { PrismaService } from 'src/prisma/prisma.service';
// import { CreateOrdonanceDto } from './dto/create-ordonance.dto';
// import { uploadImageToCloudinary } from 'src/utils/cloudinary';
// import { UpdateOrdonanceDto } from './dto/update-ordonance.dto';
// import { Ordonance, Prisma, Reservation, User } from 'generated/prisma';
// import { OrdonanceFilterDto } from './dto/ordonance-filter.dto';

// @Injectable()
// export class OrdonancesService {
//   constructor(private readonly prisma: PrismaService) {}

//  async create(dto: CreateOrdonanceDto): Promise<Ordonance> {
//     const exists = await this.prisma.ordonance.findFirst({ where: { reservationId: dto.reservationId } });
//     if (exists) throw new ConflictException("Une ordonnance existe déjà pour cette réservation.");

//     const urls: string[] = [];
//     if (dto.images) {
//       for (const file of dto.images) {
//         urls.push(await uploadImageToCloudinary(file, 'ordonances'));
//       }
//     }

//     return this.prisma.ordonance.create({
//       data: {
//         reservation: { connect: { reservationId: dto.reservationId } },
//         medecin:     { connect: { userId: dto.medecinId } },
//         patient:     { connect: { userId: dto.patientId } },
//         dureeTraitement: dto.dureeTraitement,
//         traitement:      dto.traitement as unknown as Prisma.InputJsonValue,
//         comment:         dto.comment,
//         images:          urls,
//       },
//     });
//   }


// async findAll(filters: OrdonanceFilterDto) {
//   const { medecinId, patientId, reservationId, createdAt, dureeTraitement, comment, page = 1, limit = 10, q } = filters;
//   const skip = (page - 1) * limit;

//   const where: any = {
//     ...(medecinId && { medecinId }),
//     ...(patientId && { patientId }),
//     ...(reservationId && { reservationId }),
//     ...(createdAt && { createdAt: { gte: new Date(createdAt) } }),
//     ...(dureeTraitement && { dureeTraitement: { contains: dureeTraitement } }),
//     ...(comment && { comment: { contains: comment } }),
//   };

//   if (q && q.trim()) {
//     const s = q.trim();
//     (where.AND ??= []).push({
//       OR: [
//         { dureeTraitement: { contains: s } },
//         { comment:         { contains: s } },
//         { medecin: { OR: [{ firstName: { contains: s } }, { lastName: { contains: s } }] } },
//         { patient: { OR: [{ firstName: { contains: s } }, { lastName: { contains: s } }] } },
//       ],
//     });
//   }

//   const [items, total] = await this.prisma.$transaction([
//     this.prisma.ordonance.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
//     this.prisma.ordonance.count({ where }),
//   ]);

//   return {
//     items,
//     meta: { total, page, limit, lastPage: Math.ceil(total / limit) },
//   };
// }

//   async update(id: number, dto: UpdateOrdonanceDto): Promise<Ordonance> {
//     const ord = await this.prisma.ordonance.findUnique({ where: { ordonanceId: id } });
//     if (!ord) throw new NotFoundException('Ordonnance introuvable.');

//     let urls = ord.images as string[];
//     if (dto.images) {
//       urls = [];
//       for (const file of dto.images) {
//         urls.push(await uploadImageToCloudinary(file, 'ordonances'));
//       }
//     }

//     const data: Prisma.OrdonanceUpdateInput = {
//       dureeTraitement: dto.dureeTraitement,
//       traitement:      (dto.traitement ?? ord.traitement) as unknown as Prisma.InputJsonValue,
//       comment:         dto.comment,
//       images:          urls,
//     };

//     return this.prisma.ordonance.update({ where: { ordonanceId: id }, data });
//   }

//   async findOne(id: number): Promise<Ordonance & { medecin: User; patient: User; reservation: Reservation }> {
//     const ord = await this.prisma.ordonance.findUnique({
//       where: { ordonanceId: id },
//       include: { medecin: true, patient: true, reservation: true },
//     });
//     if (!ord) throw new NotFoundException('Ordonnance introuvable.');
//     return ord;
//   }
// }
// src/ordonances/ordonances.service.ts
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateOrdonanceDto } from './dto/create-ordonance.dto';
import { uploadImageToCloudinary } from 'src/utils/cloudinary';
import { UpdateOrdonanceDto } from './dto/update-ordonance.dto';
import { Ordonance, Prisma, Reservation, User } from 'generated/prisma';
import { OrdonanceFilterDto } from './dto/ordonance-filter.dto';
import { bi, isValidExpoToken, sendExpoPush } from 'src/utils/expo-push';

@Injectable()
export class OrdonancesService {
  constructor(private readonly prisma: PrismaService) {}

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

    const urls: string[] = [];
    if (dto.images?.length) {
      for (const file of dto.images) {
        urls.push(await uploadImageToCloudinary(file, 'ordonances'));
      }
    }

    const ord = await this.prisma.ordonance.create({
      data: {
        reservation: { connect: { reservationId: dto.reservationId } },
        medecin:     { connect: { userId: dto.medecinId } },
        patient:     { connect: { userId: dto.patientId } },
        name:            dto.name ?? null,            // 👈 NEW
        dureeTraitement: dto.dureeTraitement,
        traitement:      dto.traitement as unknown as Prisma.InputJsonValue,
        comment:         dto.comment,
        images:          urls,
      },
    });

    // 🔔 Notifications DB
    const titleFr = 'Nouvelle ordonnance';
    const titleEn = 'New prescription';
    const patientMsgFr = `Le Dr ${med.firstName} ${med.lastName} a émis une ordonnance${dto.name ? ` : ${dto.name}` : ''}.`;
    const patientMsgEn = `Dr ${med.firstName} ${med.lastName} issued a prescription${dto.name ? `: ${dto.name}` : ''}.`;

    const doctorMsgFr  = `Ordonnance ${dto.name ? `"${dto.name}" ` : ''}créée pour ${pat.firstName} ${pat.lastName}.`;
    const doctorMsgEn  = `Prescription ${dto.name ? `"${dto.name}" ` : ''}created for ${pat.firstName} ${pat.lastName}.`;

    void Promise.all([
      this.notify(pat.userId, titleFr, titleEn, patientMsgFr, patientMsgEn),
      this.notify(med.userId, titleFr, titleEn, doctorMsgFr, doctorMsgEn),
    ]).catch(() => void 0);

    // 📣 Push Expo — patient
    if (isValidExpoToken(pat.expotoken)) {
      void sendExpoPush({
        to: pat.expotoken!,
        sound: 'default',
        title: bi(titleFr, titleEn),
        body:  bi(patientMsgFr, patientMsgEn),
        data:  { kind: 'ORDONANCE_NEW', ordonanceId: ord.ordonanceId, reservationId: ord.reservationId },
        priority: 'high',
      });
    }
    // 📣 Push Expo — médecin (facultatif mais utile)
    if (isValidExpoToken(med.expotoken)) {
      void sendExpoPush({
        to: med.expotoken!,
        sound: 'default',
        title: bi(titleFr, titleEn),
        body:  bi(doctorMsgFr, doctorMsgEn),
        data:  { kind: 'ORDONANCE_CREATED', ordonanceId: ord.ordonanceId, reservationId: ord.reservationId },
        priority: 'high',
      });
    }

    return ord;
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
      // ensure AND is an array before pushing (Prisma types allow single object or array)
      if (!Array.isArray(where.AND)) {
        where.AND = where.AND ? [where.AND as Prisma.OrdonanceWhereInput] : [];
      }
      (where.AND as Prisma.OrdonanceWhereInput[]).push({
        OR: [
          { name:            { contains: s } },  // 👈 NEW: recherche par nom
          { dureeTraitement: { contains: s } },
          { comment:         { contains: s } },
          { medecin: { OR: [{ firstName: { contains: s } }, { lastName: { contains: s } }] } },
          { patient: { OR: [{ firstName: { contains: s } }, { lastName: { contains: s } }] } },
        ],
      });
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.ordonance.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
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
      name:            dto.name ?? ord.name,          // 👈 NEW
      dureeTraitement: dto.dureeTraitement,
      traitement:      (dto.traitement ?? ord.traitement) as unknown as Prisma.InputJsonValue,
      comment:         dto.comment,
      images:          urls,
    };

    return this.prisma.ordonance.update({ where: { ordonanceId: id }, data });
  }

  async findOne(id: number): Promise<Ordonance & { medecin: User; patient: User; reservation: Reservation }> {
    const ord = await this.prisma.ordonance.findUnique({
      where: { ordonanceId: id },
      include: { medecin: true, patient: true, reservation: true },
    });
    if (!ord) throw new NotFoundException('Ordonnance introuvable.');
    return ord;
  }
}

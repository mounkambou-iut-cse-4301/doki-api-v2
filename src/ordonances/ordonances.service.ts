import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateOrdonanceDto } from './dto/create-ordonance.dto';
import { uploadImageToCloudinary } from 'src/utils/cloudinary';
import { UpdateOrdonanceDto } from './dto/update-ordonance.dto';
import { Ordonance, Prisma, Reservation, User } from 'generated/prisma';
import { OrdonanceFilterDto } from './dto/ordonance-filter.dto';

@Injectable()
export class OrdonancesService {
  constructor(private readonly prisma: PrismaService) {}

 async create(dto: CreateOrdonanceDto): Promise<Ordonance> {
    const exists = await this.prisma.ordonance.findFirst({ where: { reservationId: dto.reservationId } });
    if (exists) throw new ConflictException("Une ordonnance existe déjà pour cette réservation.");

    const urls: string[] = [];
    if (dto.images) {
      for (const file of dto.images) {
        urls.push(await uploadImageToCloudinary(file, 'ordonances'));
      }
    }

    return this.prisma.ordonance.create({
      data: {
        reservation: { connect: { reservationId: dto.reservationId } },
        medecin:     { connect: { userId: dto.medecinId } },
        patient:     { connect: { userId: dto.patientId } },
        dureeTraitement: dto.dureeTraitement,
        traitement:      dto.traitement as unknown as Prisma.InputJsonValue,
        comment:         dto.comment,
        images:          urls,
      },
    });
  }
// async findAll(filters: OrdonanceFilterDto): Promise<Ordonance[]> {
//         const { medecinId, patientId, reservationId, createdAt, dureeTraitement, comment, page = 1, limit = 10 } = filters;
//         const skip = (page - 1) * limit;

// const where: Prisma.OrdonanceWhereInput = {
//   ...(medecinId && { medecinId }),
//   ...(patientId && { patientId }),
//   ...(reservationId && { reservationId }),
//   ...(createdAt && { createdAt: { gte: new Date(createdAt) } }),
//   ...(dureeTraitement && { dureeTraitement: { contains: dureeTraitement } }),
//   ...(comment && { comment: { contains: comment } }),
// };

// if (filters.q && filters.q.trim()) {
//   const q = filters.q.trim();
//   (where.AND ??= []).push({
//     OR: [
//       { dureeTraitement: { contains: q } },
//       { comment:         { contains: q } },
//       { medecin: { OR: [{ firstName: { contains: q } }, { lastName: { contains: q } }] } },
//       { patient: { OR: [{ firstName: { contains: q } }, { lastName: { contains: q } }] } },
//     ],
//   });
// }


//         const ordonnances = await this.prisma.ordonance.findMany({
//             where,
//             skip,
//             take: limit,
//         });

//         return ordonnances;
//     }

async findAll(filters: OrdonanceFilterDto) {
  const { medecinId, patientId, reservationId, createdAt, dureeTraitement, comment, page = 1, limit = 10, q } = filters;
  const skip = (page - 1) * limit;

  const where: any = {
    ...(medecinId && { medecinId }),
    ...(patientId && { patientId }),
    ...(reservationId && { reservationId }),
    ...(createdAt && { createdAt: { gte: new Date(createdAt) } }),
    ...(dureeTraitement && { dureeTraitement: { contains: dureeTraitement } }),
    ...(comment && { comment: { contains: comment } }),
  };

  if (q && q.trim()) {
    const s = q.trim();
    (where.AND ??= []).push({
      OR: [
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

  return {
    items,
    meta: { total, page, limit, lastPage: Math.ceil(total / limit) },
  };
}

  async update(id: number, dto: UpdateOrdonanceDto): Promise<Ordonance> {
    const ord = await this.prisma.ordonance.findUnique({ where: { ordonanceId: id } });
    if (!ord) throw new NotFoundException('Ordonnance introuvable.');

    let urls = ord.images as string[];
    if (dto.images) {
      urls = [];
      for (const file of dto.images) {
        urls.push(await uploadImageToCloudinary(file, 'ordonances'));
      }
    }

    const data: Prisma.OrdonanceUpdateInput = {
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

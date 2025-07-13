import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateOrdonanceDto } from './dto/create-ordonance.dto';
import { uploadImageToCloudinary } from 'src/utils/cloudinary';
import { UpdateOrdonanceDto } from './dto/update-ordonance.dto';
import { Ordonance, Prisma, Reservation, User } from 'generated/prisma';

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

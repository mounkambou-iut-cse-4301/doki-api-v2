// src/protocoles-ordonance/protocoles-ordonance.service.ts
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateProtocoleOrdonanceDto } from './dto/create-protocole-ordonance.dto';
import { UpdateProtocoleOrdonanceDto } from './dto/update-protocole-ordonance.dto';
import { QueryProtocoleOrdonanceDto } from './dto/query-protocole-ordonance.dto';
import { Prisma } from 'generated/prisma';
import { uploadImageToCloudinary } from 'src/utils/cloudinary';

@Injectable()
export class ProtocolesOrdonanceService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateProtocoleOrdonanceDto) {
    // unique name -> si déjà existant on lève une erreur
    const exists = await this.prisma.protocoleOrdonance.findUnique({ where: { name: dto.name } });
    if (exists) throw new BadRequestException('Un protocole porte déjà ce nom.');

    let images: string[] | undefined = undefined;
    if (dto.images?.length) {
      images = [];
      for (const f of dto.images) {
        images.push(await uploadImageToCloudinary(f, 'protocoles'));
      }
    }

    const created = await this.prisma.protocoleOrdonance.create({
      data: {
        name: dto.name,
        description: dto.description,
        traitement: dto.traitement as unknown as Prisma.InputJsonValue,
        images,
      },
    });
    return { message: 'Protocole créé', item: created };
  }

  async update(id: number, dto: UpdateProtocoleOrdonanceDto) {
    const current = await this.prisma.protocoleOrdonance.findUnique({ where: { protocoleId: id } });
    if (!current) throw new NotFoundException('Protocole introuvable');

    let images = (current.images as string[]) ?? undefined;
    if (dto.images) {
      images = [];
      for (const f of dto.images) {
        images.push(await uploadImageToCloudinary(f, 'protocoles'));
      }
    }

    const updated = await this.prisma.protocoleOrdonance.update({
      where: { protocoleId: id },
      data: {
        name: dto.name ?? current.name,
        description: dto.description ?? current.description,
        traitement: (dto.traitement ?? current.traitement) as unknown as Prisma.InputJsonValue,
        images,
      },
    });
    return { message: 'Protocole mis à jour', item: updated };
  }

  async findOne(id: number) {
    const item = await this.prisma.protocoleOrdonance.findUnique({ where: { protocoleId: id } });
    if (!item) throw new NotFoundException('Protocole introuvable');
    return { item };
  }

  async findAll(query: QueryProtocoleOrdonanceDto) {
    const page  = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 10);
    if (page < 1 || limit < 1) throw new BadRequestException('Page et limit >= 1');
    const skip = (page - 1) * limit;

    const where: Prisma.ProtocoleOrdonanceWhereInput = {};
    if (query.q && query.q.trim()) {
      where.name = { contains: query.q.trim() }; // 👈 recherche par nom de maladie
    }

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.protocoleOrdonance.findMany({ where, skip, take: limit, orderBy: { name: 'asc' } }),
      this.prisma.protocoleOrdonance.count({ where }),
    ]);

    return { items: rows, meta: { total, page, limit, lastPage: Math.ceil(total / limit) } };
  }
}

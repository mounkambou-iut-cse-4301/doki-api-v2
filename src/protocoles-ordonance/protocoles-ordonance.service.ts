// src/protocoles-ordonance/protocoles-ordonance.service.ts
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateProtocoleOrdonanceDto } from './dto/create-protocole-ordonance.dto';
import { UpdateProtocoleOrdonanceDto } from './dto/update-protocole-ordonance.dto';
import { QueryProtocoleOrdonanceDto } from './dto/query-protocole-ordonance.dto';
import { Prisma } from 'generated/prisma';
import { uploadImageToCloudinary } from 'src/utils/cloudinary';
import { QueryMedicamentDto } from './dto/query-medicament.dto';
import { UpdateMedicamentDto } from './dto/update-medicament.dto';
import { CreateMedicamentDto } from './dto/create-medicament.dto';

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

  // ====== MÉDICAMENTS ======

  async createMedicament(dto: CreateMedicamentDto) {
    const created = await this.prisma.medicament.create({
      data: {
        name: dto.name,
        dosage: dto.dosage,
        forme: dto.forme,
        voie: dto.voie,
        posologie: dto.posologie,
        comment: dto.comment,
      },
    });
    return { message: 'Médicament créé', item: created };
  }

  async updateMedicament(id: number, dto: UpdateMedicamentDto) {
    const current = await this.prisma.medicament.findUnique({
      where: { medicamentId: id },
    });
    if (!current) {
      throw new NotFoundException('Médicament introuvable');
    }

    const updated = await this.prisma.medicament.update({
      where: { medicamentId: id },
      data: {
        name: dto.name ?? current.name,
        dosage: dto.dosage ?? current.dosage,
        forme: dto.forme ?? current.forme,
        voie: dto.voie ?? current.voie,
        posologie: dto.posologie ?? current.posologie,
        comment: dto.comment ?? current.comment,
      },
    });

    return { message: 'Médicament mis à jour', item: updated };
  }

  async deleteMedicament(id: number) {
    const current = await this.prisma.medicament.findUnique({
      where: { medicamentId: id },
    });
    if (!current) {
      throw new NotFoundException('Médicament introuvable');
    }

    await this.prisma.medicament.delete({
      where: { medicamentId: id },
    });

    return { message: 'Médicament supprimé' };
  }

  async findOneMedicament(id: number) {
    const item = await this.prisma.medicament.findUnique({
      where: { medicamentId: id },
    });
    if (!item) {
      throw new NotFoundException('Médicament introuvable');
    }
    return { item };
  }

  async findAllMedicaments(query: QueryMedicamentDto) {
    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 10);
    if (page < 1 || limit < 1) {
      throw new BadRequestException('Page et limit >= 1');
    }
    const skip = (page - 1) * limit;

    const where: Prisma.MedicamentWhereInput = {};

    const q = query.q?.trim();
    if (q) {
      where.OR = [
        { name: { contains: q } },
        { dosage: { contains: q } },
        { forme: { contains: q } },
        { voie: { contains: q } },
        { posologie: { contains: q } },
      ];
    }

    if (query.name) {
      where.name = { contains: query.name.trim() };
    }
    if (query.dosage) {
      where.dosage = { contains: query.dosage.trim() };
    }
    if (query.forme) {
      where.forme = { contains: query.forme.trim() };
    }
    if (query.voie) {
      where.voie = { contains: query.voie.trim() };
    }
    if (query.posologie) {
      where.posologie = { contains: query.posologie.trim() };
    }

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.medicament.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      this.prisma.medicament.count({ where }),
    ]);

    return {
      items: rows,
      meta: {
        total,
        page,
        limit,
        lastPage: Math.ceil(total / limit),
      },
    };
  }
}

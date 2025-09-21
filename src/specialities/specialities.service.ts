import { PrismaService } from './../prisma/prisma.service';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateSpecialityDto } from './dto/create-specialityDto';
import { UpdateSpecialityDto } from './dto/update-specialityDto';
import { QuerySpecialityDto } from './dto/query-specialityDto';

@Injectable()
export class SpecialitiesService {
  constructor(private readonly prismaService: PrismaService) {}
  async createSpecialy(dto: CreateSpecialityDto) {
    try {
      // 1) Vérification d'existence (insensitive)
      const exists = await this.prismaService.speciality.findFirst({
        where: { name: { equals: dto.name } },
      });
      if (exists) {
        throw new ConflictException({
          message: `La spécialité '${dto.name}' existe déjà.`,
          messageE: `Speciality '${dto.name}' already exists.`,
        });
      }

      // 2) Création
      return await this.prismaService.speciality.create({ data: dto });
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      // Erreur générique
      throw new BadRequestException({
        message: `Erreur lors de la création : ${error.message}`,
        messageE: `Error while creating: ${error.message}`,
      });
    }
  }

  async update(id: number, dto: UpdateSpecialityDto) {
    try {
      const speciality = await this.prismaService.speciality.findUnique({
        where: { specialityId: id },
      });
      if (!speciality) {
        throw new NotFoundException({
          message: `Spécialité d'ID ${id} introuvable.`,
          messageE: `Speciality with ID ${id} not found.`,
        });
      }

      if (
        dto.name &&
        dto.name.toLowerCase() !== speciality.name.toLowerCase()
      ) {
        const other = await this.prismaService.speciality.findFirst({
          where: { name: dto.name },
        });
        if (other) {
          throw new ConflictException({
            message: `La spécialité '${dto.name}' existe déjà.`,
            messageE: `Speciality '${dto.name}' already exists.`,
          });
        }
      }

      return await this.prismaService.speciality.update({
        where: { specialityId: id },
        data: dto,
      });
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new BadRequestException({
        message: `Erreur lors de la mise à jour : ${error.message}`,
        messageE: `Error while updating: ${error.message}`,
      });
    }
  }

async findAll(query: QuerySpecialityDto) {
  const page  = query.page ?? 1;
  const limit = query.limit ?? 10;
  const skip  = (page - 1) * limit;

  const where: any = {};
  if (query.q && query.q.trim()) {
    where.name = { contains: query.q.trim() };
  }

  const [items, total] = await this.prismaService.$transaction([
    this.prismaService.speciality.findMany({
      where, skip, take: limit, orderBy: { name: 'asc' },
    }),
    this.prismaService.speciality.count({ where }),
  ]);
  return { items, meta: { total, page, limit, lastPage: Math.ceil(total/limit) } };
}


  async findOne(id: number) {
    try {
      const speciality = await this.prismaService.speciality.findUnique({
        where: { specialityId: id },
      });
      if (!speciality) {
        throw new NotFoundException({
          message: `Spécialité d'ID ${id} introuvable.`,
          messageE: `Speciality with ID ${id} not found.`,
        });
      }
      return speciality;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException({
        message: `Erreur lors de la récupération : ${error.message}`,
        messageE: `Error while fetching: ${error.message}`,
      });
    }
  }
}

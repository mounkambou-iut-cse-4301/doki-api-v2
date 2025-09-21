import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UserType } from 'generated/prisma';
import { CreateMedecinDto } from './dto/create-medecin.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { UpdateMedecinDto } from './dto/update-medecin.dto';
import { QueryUserDto } from './dto/query-user.dto';
import * as bcrypt from 'bcryptjs';

const userSafeSelect = {
  userId: true,
  firstName: true,
  lastName: true,
  sex: true,
  email: true,
  phone: true,
  acceptPrivacy: true,
  city: true,
  address: true,
  addressHosp: true,
  hospitalName: true,
  longitude: true,
  latitude: true,
  profile: true,
  weight: true,
  matricule: true,
  userType: true,
  isBlock: true,
  isVerified: true,
  specialityId: true,
};

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  // 1. SIGNUP PATIENT
  async signupPatient(dto: CreatePatientDto) {
    try {
      // Vérif email
      const byEmail = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });
      if (byEmail) {
        throw new ConflictException({
          message: `L'email '${dto.email}' est déjà utilisé.`,
          messageE: `Email '${dto.email}' is already in use.`,
        });
      }
      // Vérif phone
      const byPhone = await this.prisma.user.findFirst({
        where: { phone: dto.phone },
      });
      if (byPhone) {
        throw new ConflictException({
          message: `Le téléphone '${dto.phone}' est déjà utilisé.`,
          messageE: `Phone '${dto.phone}' is already in use.`,
        });
      }

      // Hash the password before saving
      const hashedPassword = await bcrypt.hash(dto.password, 10);

      return this.prisma.user.create({
        data: {
          ...dto,
          password: hashedPassword,
          userType: UserType.PATIENT,
        },
      });
    } catch (error) {
      if (error instanceof ConflictException) throw error;
      throw new BadRequestException({
        message: `Erreur création patient : ${error.message}`,
        messageE: `Error creating patient: ${error.message}`,
      });
    }
  }

  // 1. SIGNUP MEDECIN
  async signupMedecin(dto: CreateMedecinDto) {
    try {
      // Vérif email
      const byEmail = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });
      if (byEmail) {
        throw new ConflictException({
          message: `L'email '${dto.email}' est déjà utilisé.`,
          messageE: `Email '${dto.email}' is already in use.`,
        });
      }
      // Vérif phone
      const byPhone = await this.prisma.user.findFirst({
        where: { phone: dto.phone },
      });
      if (byPhone) {
        throw new ConflictException({
          message: `Le téléphone '${dto.phone}' est déjà utilisé.`,
          messageE: `Phone '${dto.phone}' is already in use.`,
        });
      }

      // Hash the password before saving
      const hashedPassword = await bcrypt.hash(dto.password, 10);

      return this.prisma.user.create({
        data: {
          ...dto,
          password: hashedPassword,
          userType: UserType.MEDECIN,
        },
      });
    } catch (error) {
      if (error instanceof ConflictException) throw error;
      throw new BadRequestException({
        message: `Erreur création médecin : ${error.message}`,
        messageE: `Error creating doctor: ${error.message}`,
      });
    }
  }

  // 2. EDIT PATIENT
  async updatePatient(id: number, dto: UpdatePatientDto) {
    try {
      const user = await this.prisma.user.findUnique({ where: { userId: id } });
      if (!user || user.userType !== UserType.PATIENT) {
        throw new NotFoundException({
          message: `Patient d'ID ${id} introuvable.`,
          messageE: `Patient with ID ${id} not found.`,
        });
      }

      // Si email modifié
      if (dto.email && dto.email !== user.email) {
        const other = await this.prisma.user.findUnique({
          where: { email: dto.email },
        });
        if (other) {
          throw new ConflictException({
            message: `L'email '${dto.email}' est déjà utilisé.`,
            messageE: `Email '${dto.email}' is already in use.`,
          });
        }
      }

      // Si phone modifié
      if (dto.phone && dto.phone !== user.phone) {
        const other = await this.prisma.user.findFirst({
          where: { phone: dto.phone },
        });
        if (other) {
          throw new ConflictException({
            message: `Le téléphone '${dto.phone}' est déjà utilisé.`,
            messageE: `Phone '${dto.phone}' is already in use.`,
          });
        }
      }

      return this.prisma.user.update({
        where: { userId: id },
        data: dto,
      });
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      )
        throw error;
      throw new BadRequestException({
        message: `Erreur mise à jour patient : ${error.message}`,
        messageE: `Error updating patient: ${error.message}`,
      });
    }
  }

  // 3. EDIT MEDECIN
  async updateMedecin(id: number, dto: UpdateMedecinDto) {
    try {
      const user = await this.prisma.user.findUnique({ where: { userId: id } });
      if (!user || user.userType !== UserType.MEDECIN) {
        throw new NotFoundException({
          message: `Médecin d'ID ${id} introuvable.`,
          messageE: `Doctor with ID ${id} not found.`,
        });
      }

      // Si email modifié
      if (dto.email && dto.email !== user.email) {
        const other = await this.prisma.user.findUnique({
          where: { email: dto.email },
        });
        if (other) {
          throw new ConflictException({
            message: `L'email '${dto.email}' est déjà utilisé.`,
            messageE: `Email '${dto.email}' is already in use.`,
          });
        }
      }

      // Si phone modifié
      if (dto.phone && dto.phone !== user.phone) {
        const other = await this.prisma.user.findFirst({
          where: { phone: dto.phone },
        });
        if (other) {
          throw new ConflictException({
            message: `Le téléphone '${dto.phone}' est déjà utilisé.`,
            messageE: `Phone '${dto.phone}' is already in use.`,
          });
        }
      }

      return this.prisma.user.update({
        where: { userId: id },
        data: dto,
      });
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      )
        throw error;
      throw new BadRequestException({
        message: `Erreur mise à jour médecin : ${error.message}`,
        messageE: `Error updating doctor: ${error.message}`,
      });
    }
  }
  // 4. GET ALL USERS AVEC FILTRES & PAGINATION
  // src/users/users.service.ts
  // async findAll(query: QueryUserDto) {
  //   try {
  //     // 1) Forcer page/limit à number
  //     const page: number = query.page != null ? Number(query.page) : 1;
  //     const limit: number = query.limit != null ? Number(query.limit) : 10;
  //     if (page < 1 || limit < 1) {
  //       throw new BadRequestException({
  //         message: 'Page et limit doivent être >= 1',
  //         messageE: 'Page and limit must be >= 1',
  //       });
  //     }
  //     const skip = (page - 1) * limit;

  //     // 2) Forcer specialityId
  //     const specialityId =
  //       query.specialityId != null ? Number(query.specialityId) : undefined;

  //     // 3) Construire le filtre `where`
  //     const where: any = {};
  //     if (query.name) {
  //       where.OR = [
  //         { firstName: { contains: query.name } },
  //         { lastName: { contains: query.name } },
  //       ];
  //     }
  //     if (query.userType) where.userType = query.userType;
  //     if (typeof query.isBlock === 'boolean') where.isBlock = query.isBlock;
  //     if (specialityId != null) where.specialityId = specialityId;
  //     if (typeof query.isVerified === 'boolean')
  //       where.isVerified = query.isVerified;

  //     // 4) Exécuter la requête en transaction pour count + items
  //     const [items, total] = await this.prisma.$transaction([
  //       this.prisma.user.findMany({
  //         where,
  //                 include: {
  //         speciality: true,
  //         feedbacksMed: true,
  //         feedbacksPat: true,
  //         plannings: true,
  //       },
  //         skip,
  //         take: limit,
  //         orderBy: { firstName: 'asc' },
  //       }),
  //       this.prisma.user.count({ where }),
  //     ]);
  //     const items1 = items.map((user) => {
  //       const { password, ...safe } = user;
  //       return safe;
  //     });
  //     return {
  //       items1,
  //       meta: {
  //         total,
  //         page,
  //         limit,
  //         lastPage: Math.ceil(total / limit),
  //       },
  //     };
  //   } catch (error) {
  //     if (error instanceof BadRequestException) throw error;
  //     throw new BadRequestException({
  //       message: `Erreur récupération : ${error.message}`,
  //       messageE: `Error fetching users: ${error.message}`,
  //     });
  //   }
  // }
async findAll(query: QueryUserDto) {
  try {
    const page: number  = query.page  != null ? Number(query.page)  : 1;
    const limit: number = query.limit != null ? Number(query.limit) : 10;
    if (page < 1 || limit < 1) {
      throw new BadRequestException({
        message: 'Page et limit doivent être >= 1',
        messageE: 'Page and limit must be >= 1',
      });
    }
    const skip = (page - 1) * limit;

    const q = (query.q && query.q.trim())
      ? query.q.trim()
      : (query.name && query.name.trim())
        ? query.name.trim()
        : undefined;

    const where: any = {};
    if (q) {
      where.OR = [
        { firstName: { contains: q } },
        { lastName:  { contains: q } },
        { email:     { contains: q } },
        { phone:     { contains: q } },
      ];
    }
    if (query.userType) where.userType = query.userType;
    if (typeof query.isBlock === 'boolean') where.isBlock = query.isBlock;
    if (query.specialityId != null) where.specialityId = Number(query.specialityId);
    if (typeof query.isVerified === 'boolean') where.isVerified = query.isVerified;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        include: {
          speciality: true,
          feedbacksMed: true,
          feedbacksPat: true,
          plannings: true,
        },
        skip,
        take: limit,
        orderBy: { firstName: 'asc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    const items1 = items.map(({ password, ...safe }) => safe);

    return {
      items1,
      meta: { total, page, limit, lastPage: Math.ceil(total / limit) },
    };
  } catch (error) {
    if (error instanceof BadRequestException) throw error;
    throw new BadRequestException({
      message: `Erreur récupération : ${error.message}`,
      messageE: `Error fetching users: ${error.message}`,
    });
  }
}

  // 5. GET ONE USER BY ID AVEC RELATIONS
  async findOne(id: number) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { userId: id },
        include: {
          speciality: true,
          feedbacksMed: true,
          feedbacksPat: true,
          favoritesMed: true,
          favoritesPat: true,
          videos: true,
          reservationsM: true,
          reservationsP: true,
          plannings: true,
          abonnementsM: {select:{ abonnementId: true, debutDate: true, endDate: true, numberOfTimePlanReservation: true, status:true,amount:true, transactionId:true, createdAt: true,medecin: {select: {userId: true, firstName: true, lastName: true, email: true}}, patient: {select: {userId: true, firstName: true, lastName: true, email: true}}}},
          abonnementsP: {select:{ abonnementId: true, debutDate: true, endDate: true, numberOfTimePlanReservation: true, status:true,amount:true, transactionId:true, createdAt: true,medecin: {select: {userId: true, firstName: true, lastName: true, email: true}}, patient: {select: {userId: true, firstName: true, lastName: true, email: true}}}},
          ordonnancesM: true,
          ordonnancesP: true,
          soldes: true,
        },
      });
      if (!user) {
        throw new NotFoundException({
          message: `Utilisateur d'ID ${id} introuvable.`,
          messageE: `User with ID ${id} not found.`,
        });
      }
      const { password, ...user1 } = user;
      return user1;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException({
        message: `Erreur récupération : ${error.message}`,
        messageE: `Error fetching user: ${error.message}`,
      });
    }
  }
}

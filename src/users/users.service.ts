// import {
//   Injectable,
//   ConflictException,
//   NotFoundException,
//   BadRequestException,
// } from '@nestjs/common';
// import { PrismaService } from '../prisma/prisma.service';
// import { CreatePatientDto } from './dto/create-patient.dto';
// import { UserType } from 'generated/prisma';
// import { CreateMedecinDto } from './dto/create-medecin.dto';
// import { UpdatePatientDto } from './dto/update-patient.dto';
// import { UpdateMedecinDto } from './dto/update-medecin.dto';
// import { QueryUserDto } from './dto/query-user.dto';
// import * as bcrypt from 'bcryptjs';
// import { CreateAdminDto } from './dto/create-admin.dto';

// const userSafeSelect = {
//   userId: true,
//   firstName: true,
//   lastName: true,
//   sex: true,
//   email: true,
//   phone: true,
//   acceptPrivacy: true,
//   city: true,
//   address: true,
//   addressHosp: true,
//   hospitalName: true,
//   longitude: true,
//   latitude: true,
//   profile: true,
//   weight: true,
//   matricule: true,
//   userType: true,
//   isBlock: true,
//   isVerified: true,
//   specialityId: true,
// };

// @Injectable()
// export class UsersService {
//   constructor(private readonly prisma: PrismaService) {}

//   // 1. SIGNUP PATIENT
//   async signupPatient(dto: CreatePatientDto) {
//     try {
//       // Vérif email
//       const byEmail = await this.prisma.user.findUnique({
//         where: { email: dto.email },
//       });
//       if (byEmail) {
//         throw new ConflictException({
//           message: `L'email '${dto.email}' est déjà utilisé.`,
//           messageE: `Email '${dto.email}' is already in use.`,
//         });
//       }
//       // Vérif phone
//       const byPhone = await this.prisma.user.findFirst({
//         where: { phone: dto.phone },
//       });
//       if (byPhone) {
//         throw new ConflictException({
//           message: `Le téléphone '${dto.phone}' est déjà utilisé.`,
//           messageE: `Phone '${dto.phone}' is already in use.`,
//         });
//       }

//       // Hash the password before saving
//       const hashedPassword = await bcrypt.hash(dto.password, 10);

//       return this.prisma.user.create({
//         data: {
//           ...dto,
//           password: hashedPassword,
//           userType: UserType.PATIENT,
//         },
//       });
//     } catch (error) {
//       if (error instanceof ConflictException) throw error;
//       throw new BadRequestException({
//         message: `Erreur création patient : ${error.message}`,
//         messageE: `Error creating patient: ${error.message}`,
//       });
//     }
//   }

//   // 1. SIGNUP MEDECIN
//   async signupMedecin(dto: CreateMedecinDto) {
//     try {
//       // Vérif email
//       const byEmail = await this.prisma.user.findUnique({
//         where: { email: dto.email },
//       });
//       if (byEmail) {
//         throw new ConflictException({
//           message: `L'email '${dto.email}' est déjà utilisé.`,
//           messageE: `Email '${dto.email}' is already in use.`,
//         });
//       }
//       // Vérif phone
//       const byPhone = await this.prisma.user.findFirst({
//         where: { phone: dto.phone },
//       });
//       if (byPhone) {
//         throw new ConflictException({
//           message: `Le téléphone '${dto.phone}' est déjà utilisé.`,
//           messageE: `Phone '${dto.phone}' is already in use.`,
//         });
//       }

//       // Hash the password before saving
//       const hashedPassword = await bcrypt.hash(dto.password, 10);

//       return this.prisma.user.create({
//         data: {
//           ...dto,
//           password: hashedPassword,
//           userType: UserType.MEDECIN,
//         },
//       });
//     } catch (error) {
//       if (error instanceof ConflictException) throw error;
//       throw new BadRequestException({
//         message: `Erreur création médecin : ${error.message}`,
//         messageE: `Error creating doctor: ${error.message}`,
//       });
//     }
//   }

//   // 2. EDIT PATIENT
//   async updatePatient(id: number, dto: UpdatePatientDto) {
//     try {
//       const user = await this.prisma.user.findUnique({ where: { userId: id } });
//       if (!user || user.userType !== UserType.PATIENT) {
//         throw new NotFoundException({
//           message: `Patient d'ID ${id} introuvable.`,
//           messageE: `Patient with ID ${id} not found.`,
//         });
//       }

//       // Si email modifié
//       if (dto.email && dto.email !== user.email) {
//         const other = await this.prisma.user.findUnique({
//           where: { email: dto.email },
//         });
//         if (other) {
//           throw new ConflictException({
//             message: `L'email '${dto.email}' est déjà utilisé.`,
//             messageE: `Email '${dto.email}' is already in use.`,
//           });
//         }
//       }

//       // Si phone modifié
//       if (dto.phone && dto.phone !== user.phone) {
//         const other = await this.prisma.user.findFirst({
//           where: { phone: dto.phone },
//         });
//         if (other) {
//           throw new ConflictException({
//             message: `Le téléphone '${dto.phone}' est déjà utilisé.`,
//             messageE: `Phone '${dto.phone}' is already in use.`,
//           });
//         }
//       }

//       return this.prisma.user.update({
//         where: { userId: id },
//         data: dto,
//       });
//     } catch (error) {
//       if (
//         error instanceof NotFoundException ||
//         error instanceof ConflictException
//       )
//         throw error;
//       throw new BadRequestException({
//         message: `Erreur mise à jour patient : ${error.message}`,
//         messageE: `Error updating patient: ${error.message}`,
//       });
//     }
//   }

//   // 3. EDIT MEDECIN
//   async updateMedecin(id: number, dto: UpdateMedecinDto) {
//     try {
//       const user = await this.prisma.user.findUnique({ where: { userId: id } });
//       if (!user || user.userType !== UserType.MEDECIN) {
//         throw new NotFoundException({
//           message: `Médecin d'ID ${id} introuvable.`,
//           messageE: `Doctor with ID ${id} not found.`,
//         });
//       }

//       // Si email modifié
//       if (dto.email && dto.email !== user.email) {
//         const other = await this.prisma.user.findUnique({
//           where: { email: dto.email },
//         });
//         if (other) {
//           throw new ConflictException({
//             message: `L'email '${dto.email}' est déjà utilisé.`,
//             messageE: `Email '${dto.email}' is already in use.`,
//           });
//         }
//       }

//       // Si phone modifié
//       if (dto.phone && dto.phone !== user.phone) {
//         const other = await this.prisma.user.findFirst({
//           where: { phone: dto.phone },
//         });
//         if (other) {
//           throw new ConflictException({
//             message: `Le téléphone '${dto.phone}' est déjà utilisé.`,
//             messageE: `Phone '${dto.phone}' is already in use.`,
//           });
//         }
//       }

//       return this.prisma.user.update({
//         where: { userId: id },
//         data: dto,
//       });
//     } catch (error) {
//       if (
//         error instanceof NotFoundException ||
//         error instanceof ConflictException
//       )
//         throw error;
//       throw new BadRequestException({
//         message: `Erreur mise à jour médecin : ${error.message}`,
//         messageE: `Error updating doctor: ${error.message}`,
//       });
//     }
//   }
//   // 4. GET ALL USERS AVEC FILTRES & PAGINATION
//   // src/users/users.service.ts
//   // async findAll(query: QueryUserDto) {
//   //   try {
//   //     // 1) Forcer page/limit à number
//   //     const page: number = query.page != null ? Number(query.page) : 1;
//   //     const limit: number = query.limit != null ? Number(query.limit) : 10;
//   //     if (page < 1 || limit < 1) {
//   //       throw new BadRequestException({
//   //         message: 'Page et limit doivent être >= 1',
//   //         messageE: 'Page and limit must be >= 1',
//   //       });
//   //     }
//   //     const skip = (page - 1) * limit;

//   //     // 2) Forcer specialityId
//   //     const specialityId =
//   //       query.specialityId != null ? Number(query.specialityId) : undefined;

//   //     // 3) Construire le filtre `where`
//   //     const where: any = {};
//   //     if (query.name) {
//   //       where.OR = [
//   //         { firstName: { contains: query.name } },
//   //         { lastName: { contains: query.name } },
//   //       ];
//   //     }
//   //     if (query.userType) where.userType = query.userType;
//   //     if (typeof query.isBlock === 'boolean') where.isBlock = query.isBlock;
//   //     if (specialityId != null) where.specialityId = specialityId;
//   //     if (typeof query.isVerified === 'boolean')
//   //       where.isVerified = query.isVerified;

//   //     // 4) Exécuter la requête en transaction pour count + items
//   //     const [items, total] = await this.prisma.$transaction([
//   //       this.prisma.user.findMany({
//   //         where,
//   //                 include: {
//   //         speciality: true,
//   //         feedbacksMed: true,
//   //         feedbacksPat: true,
//   //         plannings: true,
//   //       },
//   //         skip,
//   //         take: limit,
//   //         orderBy: { firstName: 'asc' },
//   //       }),
//   //       this.prisma.user.count({ where }),
//   //     ]);
//   //     const items1 = items.map((user) => {
//   //       const { password, ...safe } = user;
//   //       return safe;
//   //     });
//   //     return {
//   //       items1,
//   //       meta: {
//   //         total,
//   //         page,
//   //         limit,
//   //         lastPage: Math.ceil(total / limit),
//   //       },
//   //     };
//   //   } catch (error) {
//   //     if (error instanceof BadRequestException) throw error;
//   //     throw new BadRequestException({
//   //       message: `Erreur récupération : ${error.message}`,
//   //       messageE: `Error fetching users: ${error.message}`,
//   //     });
//   //   }
//   // }
// async findAll(query: QueryUserDto) {
//   try {
//     const page: number  = query.page  != null ? Number(query.page)  : 1;
//     const limit: number = query.limit != null ? Number(query.limit) : 10;
//     if (page < 1 || limit < 1) {
//       throw new BadRequestException({
//         message: 'Page et limit doivent être >= 1',
//         messageE: 'Page and limit must be >= 1',
//       });
//     }
//     const skip = (page - 1) * limit;

//     const q = (query.q && query.q.trim())
//       ? query.q.trim()
//       : (query.name && query.name.trim())
//         ? query.name.trim()
//         : undefined;

//     const where: any = {};
//     if (q) {
//       where.OR = [
//         { firstName: { contains: q } },
//         { lastName:  { contains: q } },
//         { email:     { contains: q } },
//         { phone:     { contains: q } },
//       ];
//     }
//     if (query.userType) where.userType = query.userType;
//     if (typeof query.isBlock === 'boolean') where.isBlock = query.isBlock;
//     if (query.specialityId != null) where.specialityId = Number(query.specialityId);
//     if (typeof query.isVerified === 'boolean') where.isVerified = query.isVerified;

//     const [items, total] = await this.prisma.$transaction([
//       this.prisma.user.findMany({
//         where,
//         include: {
//           speciality: true,

//           // Derniers 3 feedbacks (côté médecin / côté patient)
//           feedbacksMed: {
//             take: 3,
//             orderBy: { createdAt: 'desc' },
//             include: {
//               patient: { select: { userId: true, firstName: true, lastName: true, profile: true } },
//             },
//           },
//           feedbacksPat: {
//             take: 3,
//             orderBy: { createdAt: 'desc' },
//             include: {
//               medecin: { select: { userId: true, firstName: true, lastName: true, profile: true } },
//             },
//           },

//           // Planning unique (le plus récent)
//           plannings: { take: 1, orderBy: { createdAt: 'desc' } },

//           // Solde unique (le plus récent)
//           soldes: { take: 1, orderBy: { updatedAt: 'desc' } },

//           // 3 derniers pour le médecin
//           reservationsM: {
//             take: 3,
//             orderBy: { createdAt: 'desc' },
//             select: {
//               reservationId: true,
//               date: true,
//               hour: true,
//               status: true,
//               patient: { select: { userId: true, firstName: true, lastName: true, profile: true } },
//             },
//           },
//           ordonnancesM: {
//             take: 3,
//             orderBy: { createdAt: 'desc' },
//             select: {
//               ordonanceId: true,
//               dureeTraitement: true,
//               createdAt: true,
//               patient: { select: { userId: true, firstName: true, lastName: true, profile: true } },
//             },
//           },
//           abonnementsM: {
//             take: 3,
//             orderBy: { createdAt: 'desc' },
//             select: {
//               abonnementId: true,
//               debutDate: true,
//               endDate: true,
//               status: true,
//               amount: true,
//               patient: { select: { userId: true, firstName: true, lastName: true, profile: true } },
//             },
//           },
//           videos: {
//             take: 3,
//             orderBy: { createdAt: 'desc' },
//             select: {
//               videoId: true,
//               title: true,
//               path: true,
//               category: true,
//               createdAt: true,
//             },
//           },
//         },
//         skip,
//         take: limit,
//         orderBy: { firstName: 'asc' },
//       }),
//       this.prisma.user.count({ where }),
//     ]);

//     // Agrégat des notes pour les médecins
//     const medecinIds = items.filter(u => u.userType === UserType.MEDECIN).map(u => u.userId);
//     let ratingMap = new Map<number, { average: number; count: number }>();
//     if (medecinIds.length) {
//       const rows = await this.prisma.feedback.groupBy({
//         by: ['medecinId'],
//         where: { medecinId: { in: medecinIds } },
//         _avg: { note: true },
//         _count: { _all: true },
//       });
//       ratingMap = new Map(
//         rows.map(r => [r.medecinId, { average: r._avg.note ?? 0, count: r._count._all }]),
//       );
//     }

//     // Retirer password + transformer collections -> objets/derniers 3
//     const items1 = items.map(
//       ({
//         password,
//         plannings,
//         soldes,
//         feedbacksMed,
//         feedbacksPat,
//         reservationsM,
//         ordonnancesM,
//         abonnementsM,
//         videos,
//         ...safe
//       }) => ({
//         ...safe,
//         planning: plannings?.[0] ?? null,
//         solde: soldes?.[0] ?? null,
//         feedbackRating:
//           safe.userType === UserType.MEDECIN
//             ? ratingMap.get(safe.userId) ?? { average: 0, count: 0 }
//             : null,
//         lastFeedbacks:
//           safe.userType === UserType.MEDECIN
//             ? feedbacksMed
//             : feedbacksPat,
//         lastReservations: reservationsM ?? [],
//         lastOrdonnances: ordonnancesM ?? [],
//         lastAbonnements: abonnementsM ?? [],
//         lastVideos: videos ?? [],
//       }),
//     );

//     return {
//       items1,
//       meta: { total, page, limit, lastPage: Math.ceil(total / limit) },
//     };
//   } catch (error) {
//     if (error instanceof BadRequestException) throw error;
//     throw new BadRequestException({
//       message: `Erreur récupération : ${error.message}`,
//       messageE: `Error fetching users: ${error.message}`,
//     });
//   }
// }




//   // 5. GET ONE USER BY ID AVEC RELATIONS
// async findOne(id: number) {
//   try {
//     const user = await this.prisma.user.findUnique({
//       where: { userId: id },
//       include: {
//         speciality: true,
//         favoritesMed: true,
//         favoritesPat: true,

//         // 3 derniers contenus côté médecin
//         videos: {
//           take: 3,
//           orderBy: { createdAt: 'desc' },
//           select: { videoId: true, title: true, path: true, category: true, createdAt: true },
//         },
//         reservationsM: {
//           take: 3,
//           orderBy: { createdAt: 'desc' },
//           select: {
//             reservationId: true,
//             date: true,
//             hour: true,
//             status: true,
//             patient: { select: { userId: true, firstName: true, lastName: true, profile: true } },
//           },
//         },
//         ordonnancesM: {
//           take: 3,
//           orderBy: { createdAt: 'desc' },
//           select: {
//             ordonanceId: true,
//             dureeTraitement: true,
//             createdAt: true,
//             patient: { select: { userId: true, firstName: true, lastName: true, profile: true } },
//           },
//         },
//         abonnementsM: {
//           take: 3,
//           orderBy: { createdAt: 'desc' },
//           select: {
//             abonnementId: true,
//             debutDate: true,
//             endDate: true,
//             numberOfTimePlanReservation: true,
//             status: true,
//             amount: true,
//             transactionId: true,
//             createdAt: true,
//             medecin: { select: { userId: true, firstName: true, lastName: true, email: true } },
//             patient: { select: { userId: true, firstName: true, lastName: true, email: true } },
//           },
//         },
//         abonnementsP: {
//           take: 3,
//           orderBy: { createdAt: 'desc' },
//           select: {
//             abonnementId: true,
//             debutDate: true,
//             endDate: true,
//             numberOfTimePlanReservation: true,
//             status: true,
//             amount: true,
//             transactionId: true,
//             createdAt: true,
//             medecin: { select: { userId: true, firstName: true, lastName: true, email: true } },
//             patient: { select: { userId: true, firstName: true, lastName: true, email: true } },
//           },
//         },

//         // Feedbacks : 3 derniers
//         feedbacksMed: {
//           take: 3,
//           orderBy: { createdAt: 'desc' },
//           include: {
//             patient: { select: { userId: true, firstName: true, lastName: true, profile: true } },
//           },
//         },
//         feedbacksPat: {
//           take: 3,
//           orderBy: { createdAt: 'asc' }, // ou 'desc' selon ton besoin
//           include: {
//             medecin: { select: { userId: true, firstName: true, lastName: true, profile: true } },
//           },
//         },
//         roles: { include: { role: true } },

//         // Un seul planning (objet)
//         plannings: { take: 1, orderBy: { createdAt: 'desc' } },

//         // Un seul solde (objet)
//         soldes: { take: 1, orderBy: { updatedAt: 'desc' } },

//         // optionnels (si tu veux les conserver)
//         reservationsP: true,
//         ordonnancesP: true,
//       },
//     });

//     if (!user) {
//       throw new NotFoundException({
//         message: `Utilisateur d'ID ${id} introuvable.`,
//         messageE: `User with ID ${id} not found.`,
//       });
//     }

//     // Note moyenne + nb d’avis si médecin
//     let feedbackRating: { average: number; count: number } | null = null;
//     if (user.userType === UserType.MEDECIN) {
//       const agg = await this.prisma.feedback.aggregate({
//         where: { medecinId: id },
//         _avg: { note: true },
//         _count: { _all: true },
//       });
//       feedbackRating = {
//         average: agg._avg.note ?? 0,
//         count: agg._count._all,
//       };
//     }

//     const {
//       password,
//       plannings,
//       soldes,
//       feedbacksMed,
//       feedbacksPat,
//       reservationsM,
//       ordonnancesM,
//       abonnementsM,
//       videos,
//       ...user1
//     } = user;

//     return {
//       ...user1,
//       planning: plannings?.[0] ?? null,
//       solde: soldes?.[0] ?? null,
//       feedbackRating,
//       lastFeedbacks: user.userType === UserType.MEDECIN ? feedbacksMed : feedbacksPat,
//       lastReservations: reservationsM ?? [],
//       lastOrdonnances: ordonnancesM ?? [],
//       lastAbonnements: abonnementsM ?? [],
//       lastVideos: videos ?? [],
//     };
//   } catch (error) {
//     if (error instanceof NotFoundException) throw error;
//     throw new BadRequestException({
//       message: `Erreur récupération : ${error.message}`,
//       messageE: `Error fetching user: ${error.message}`,
//     });
//   }
// }
// // 1) Création d'un administrateur avec ses rôles (par roleId)
//   async signupAdmin(dto: CreateAdminDto) {
//     try {
//       // Vérif email
//       const byEmail = await this.prisma.user.findUnique({
//         where: { email: dto.email },
//       });
//       if (byEmail) {
//         throw new ConflictException({
//           message: `L'email '${dto.email}' est déjà utilisé.`,
//           messageE: `Email '${dto.email}' is already in use.`,
//         });
//       }
//       // Vérif phone
//       const byPhone = await this.prisma.user.findFirst({
//         where: { phone: dto.phone },
//       });
//       if (byPhone) {
//         throw new ConflictException({
//           message: `Le téléphone '${dto.phone}' est déjà utilisé.`,
//           messageE: `Phone '${dto.phone}' is already in use.`,
//         });
//       }

//       const hashedPassword = await bcrypt.hash(dto.password, 10);

//       const userType = dto.isSuperAdmin ? UserType.SUPERADMIN : UserType.ADMIN;

//       const admin = await this.prisma.user.create({
//         data: {
//           firstName: dto.firstName,
//           lastName: dto.lastName,
//           sex: dto.sex,
//           email: dto.email,
//           phone: dto.phone,
//           password: hashedPassword,
//           userType,
//           acceptPrivacy: true,
//         },
//       });

//       // Attribution des rôles si fournis (par roleId)
//       if (dto.roleIds?.length) {
//         // Optionnel : vérifier que les rôles existent
//         const roles = await this.prisma.role.findMany({
//           where: { roleId: { in: dto.roleIds } },
//         });

//         const validRoleIds = roles.map(r => r.roleId);
//         const data = validRoleIds.map(roleId => ({
//           userId: admin.userId,
//           roleId,
//         }));

//         if (data.length) {
//           await this.prisma.userRole.createMany({
//             data,
//             skipDuplicates: true,
//           });
//         }
//       }

//       return this.findOne(admin.userId);
//     } catch (error) {
//       if (error instanceof ConflictException) throw error;
//       throw new BadRequestException({
//         message: `Erreur création administrateur : ${error.message}`,
//         messageE: `Error creating admin: ${error.message}`,
//       });
//     }
//   }

//   // 2) Attribuer un rôle à un admin (roleId envoyé par le front)
//   async addRoleToAdmin(userId: number, roleId: number) {
//     const user = await this.prisma.user.findUnique({ where: { userId } });
//     if (!user || (user.userType !== UserType.ADMIN && user.userType !== UserType.SUPERADMIN)) {
//       throw new BadRequestException({
//         message: `L'utilisateur ${userId} n'est pas un administrateur.`,
//         messageE: `User ${userId} is not an admin.`,
//       });
//     }

//     const role = await this.prisma.role.findUnique({ where: { roleId } });
//     if (!role) {
//       throw new NotFoundException({
//         message: `Rôle d'ID ${roleId} introuvable.`,
//         messageE: `Role with ID ${roleId} not found.`,
//       });
//     }

//     await this.prisma.userRole.upsert({
//       where: {
//         userId_roleId: {
//           userId,
//           roleId,
//         },
//       },
//       update: {},
//       create: {
//         userId,
//         roleId,
//       },
//     });

//     return { message: 'Rôle attribué.', userId, roleId };
//   }

//   // 3) Retirer un rôle à un admin (roleId envoyé par le front)
//   async removeRoleFromAdmin(userId: number, roleId: number) {
//     // On vérifie que le rôle existe (optionnel mais propre)
//     const role = await this.prisma.role.findUnique({ where: { roleId } });
//     if (!role) {
//       throw new NotFoundException({
//         message: `Rôle d'ID ${roleId} introuvable.`,
//         messageE: `Role with ID ${roleId} not found.`,
//       });
//     }

//     await this.prisma.userRole.delete({
//       where: {
//         userId_roleId: {
//           userId,
//           roleId,
//         },
//       },
//     });

//     return { message: 'Rôle retiré.', userId, roleId };
//   }

// }
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
import { CreateAdminDto } from './dto/create-admin.dto';

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

  // Méthode utilitaire pour vérifier l'unicité par type
  private async checkUniqueEmailAndPhone(
    email: string,
    phone: string,
    userType: UserType,
    excludeUserId?: number
  ) {
    // Vérifier l'email pour le même type d'utilisateur
    const emailConflict = await this.prisma.user.findFirst({
      where: {
        email,
        userType,
        NOT: excludeUserId ? { userId: excludeUserId } : undefined,
      },
    });
    
    if (emailConflict) {
      throw new ConflictException({
        message: `Un ${userType === UserType.PATIENT ? 'patient' : 'médecin'} avec l'email '${email}' existe déjà.`,
        messageE: `A ${userType === UserType.PATIENT ? 'patient' : 'doctor'} with email '${email}' already exists.`,
      });
    }

    // Vérifier le téléphone pour le même type d'utilisateur
    const phoneConflict = await this.prisma.user.findFirst({
      where: {
        phone,
        userType,
        NOT: excludeUserId ? { userId: excludeUserId } : undefined,
      },
    });
    
    if (phoneConflict) {
      throw new ConflictException({
        message: `Un ${userType === UserType.PATIENT ? 'patient' : 'médecin'} avec le téléphone '${phone}' existe déjà.`,
        messageE: `A ${userType === UserType.PATIENT ? 'patient' : 'doctor'} with phone '${phone}' already exists.`,
      });
    }
  }

  // 1. SIGNUP PATIENT
  async signupPatient(dto: CreatePatientDto) {
    try {
      // Vérifier l'unicité pour le type PATIENT
      await this.checkUniqueEmailAndPhone(dto.email, dto.phone, UserType.PATIENT);

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

  // 2. SIGNUP MEDECIN
  // 2. SIGNUP MEDECIN
async signupMedecin(dto: CreateMedecinDto) {
  try {
    // Vérifier l'unicité pour le type MEDECIN
    await this.checkUniqueEmailAndPhone(dto.email, dto.phone, UserType.MEDECIN);

    // Vérifier que la spécialité existe si elle est fournie
    if (dto.specialityId) {
      const speciality = await this.prisma.speciality.findUnique({
        where: { specialityId: dto.specialityId },
      });
      if (!speciality) {
        throw new BadRequestException({
          message: `La spécialité avec l'ID ${dto.specialityId} n'existe pas.`,
          messageE: `Speciality with ID ${dto.specialityId} does not exist.`,
        });
      }
    }

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

  // 3. EDIT PATIENT
  async updatePatient(id: number, dto: UpdatePatientDto) {
    try {
      const user = await this.prisma.user.findUnique({ where: { userId: id } });
      if (!user || user.userType !== UserType.PATIENT) {
        throw new NotFoundException({
          message: `Patient d'ID ${id} introuvable.`,
          messageE: `Patient with ID ${id} not found.`,
        });
      }

      // Vérifier l'unicité pour le type PATIENT (en excluant l'utilisateur actuel)
      if (dto.email || dto.phone) {
        await this.checkUniqueEmailAndPhone(
          dto.email || user.email,
          dto.phone || user.phone,
          UserType.PATIENT,
          id
        );
      }

      return this.prisma.user.update({
        where: { userId: id },
        data: dto,
      });
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) throw error;
      throw new BadRequestException({
        message: `Erreur mise à jour patient : ${error.message}`,
        messageE: `Error updating patient: ${error.message}`,
      });
    }
  }

  // 4. EDIT MEDECIN
  async updateMedecin(id: number, dto: UpdateMedecinDto) {
    try {
      const user = await this.prisma.user.findUnique({ where: { userId: id } });
      if (!user || user.userType !== UserType.MEDECIN) {
        throw new NotFoundException({
          message: `Médecin d'ID ${id} introuvable.`,
          messageE: `Doctor with ID ${id} not found.`,
        });
      }

      // Vérifier l'unicité pour le type MEDECIN (en excluant l'utilisateur actuel)
      if (dto.email || dto.phone) {
        await this.checkUniqueEmailAndPhone(
          dto.email || user.email,
          dto.phone || user.phone,
          UserType.MEDECIN,
          id
        );
      }

      return this.prisma.user.update({
        where: { userId: id },
        data: dto,
      });
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) throw error;
      throw new BadRequestException({
        message: `Erreur mise à jour médecin : ${error.message}`,
        messageE: `Error updating doctor: ${error.message}`,
      });
    }
  }

  // 5. GET ALL USERS AVEC FILTRES & PAGINATION
  // async findAll(query: QueryUserDto) {
  //   try {
  //     const page: number = query.page != null ? Number(query.page) : 1;
  //     const limit: number = query.limit != null ? Number(query.limit) : 10;
  //     if (page < 1 || limit < 1) {
  //       throw new BadRequestException({
  //         message: 'Page et limit doivent être >= 1',
  //         messageE: 'Page and limit must be >= 1',
  //       });
  //     }
  //     const skip = (page - 1) * limit;

  //     const q = (query.q && query.q.trim())
  //       ? query.q.trim()
  //       : (query.name && query.name.trim())
  //         ? query.name.trim()
  //         : undefined;

  //     const where: any = {};
  //     if (q) {
  //       where.OR = [
  //         { firstName: { contains: q } },
  //         { lastName: { contains: q } },
  //         { email: { contains: q } },
  //         { phone: { contains: q } },
  //       ];
  //     }
  //     if (query.userType) where.userType = query.userType;
  //     if (typeof query.isBlock === 'boolean') where.isBlock = query.isBlock;
  //     if (query.specialityId != null) where.specialityId = Number(query.specialityId);
  //     if (typeof query.isVerified === 'boolean') where.isVerified = query.isVerified;

  //     const [items, total] = await this.prisma.$transaction([
  //       this.prisma.user.findMany({
  //         where,
  //         include: {
  //           speciality: true,

  //           feedbacksMed: {
  //             take: 3,
  //             orderBy: { createdAt: 'desc' },
  //             include: {
  //               patient: { select: { userId: true, firstName: true, lastName: true, profile: true } },
  //             },
  //           },
  //           feedbacksPat: {
  //             take: 3,
  //             orderBy: { createdAt: 'desc' },
  //             include: {
  //               medecin: { select: { userId: true, firstName: true, lastName: true, profile: true } },
  //             },
  //           },
  //           plannings: { take: 1, orderBy: { createdAt: 'desc' } },
  //           soldes: { take: 1, orderBy: { updatedAt: 'desc' } },
  //           reservationsM: {
  //             take: 3,
  //             orderBy: { createdAt: 'desc' },
  //             select: {
  //               reservationId: true,
  //               date: true,
  //               hour: true,
  //               status: true,
  //               patient: { select: { userId: true, firstName: true, lastName: true, profile: true } },
  //             },
  //           },
  //           ordonnancesM: {
  //             take: 3,
  //             orderBy: { createdAt: 'desc' },
  //             select: {
  //               ordonanceId: true,
  //               dureeTraitement: true,
  //               createdAt: true,
  //               patient: { select: { userId: true, firstName: true, lastName: true, profile: true } },
  //             },
  //           },
  //           abonnementsM: {
  //             take: 3,
  //             orderBy: { createdAt: 'desc' },
  //             select: {
  //               abonnementId: true,
  //               debutDate: true,
  //               endDate: true,
  //               status: true,
  //               amount: true,
  //               patient: { select: { userId: true, firstName: true, lastName: true, profile: true } },
  //             },
  //           },
  //           videos: {
  //             take: 3,
  //             orderBy: { createdAt: 'desc' },
  //             select: {
  //               videoId: true,
  //               title: true,
  //               path: true,
  //               category: true,
  //               createdAt: true,
  //             },
  //           },
  //         },
  //         skip,
  //         take: limit,
  //         orderBy: { firstName: 'asc' },
  //       }),
  //       this.prisma.user.count({ where }),
  //     ]);

  //     const medecinIds = items.filter(u => u.userType === UserType.MEDECIN).map(u => u.userId);
  //     let ratingMap = new Map<number, { average: number; count: number }>();
  //     if (medecinIds.length) {
  //       const rows = await this.prisma.feedback.groupBy({
  //         by: ['medecinId'],
  //         where: { medecinId: { in: medecinIds } },
  //         _avg: { note: true },
  //         _count: { _all: true },
  //       });
  //       ratingMap = new Map(
  //         rows.map(r => [r.medecinId, { average: r._avg.note ?? 0, count: r._count._all }]),
  //       );
  //     }

  //     const items1 = items.map(
  //       ({
  //         password,
  //         plannings,
  //         soldes,
  //         feedbacksMed,
  //         feedbacksPat,
  //         reservationsM,
  //         ordonnancesM,
  //         abonnementsM,
  //         videos,
  //         ...safe
  //       }) => ({
  //         ...safe,
  //         planning: plannings?.[0] ?? null,
  //         solde: soldes?.[0] ?? null,
  //         feedbackRating:
  //           safe.userType === UserType.MEDECIN
  //             ? ratingMap.get(safe.userId) ?? { average: 0, count: 0 }
  //             : null,
  //         lastFeedbacks:
  //           safe.userType === UserType.MEDECIN
  //             ? feedbacksMed
  //             : feedbacksPat,
  //         lastReservations: reservationsM ?? [],
  //         lastOrdonnances: ordonnancesM ?? [],
  //         lastAbonnements: abonnementsM ?? [],
  //         lastVideos: videos ?? [],
  //       }),
  //     );

  //     return {
  //       items1,
  //       meta: { total, page, limit, lastPage: Math.ceil(total / limit) },
  //     };
  //   } catch (error) {
  //     if (error instanceof BadRequestException) throw error;
  //     throw new BadRequestException({
  //       message: `Erreur récupération : ${error.message}`,
  //       messageE: `Error fetching users: ${error.message}`,
  //     });
  //   }
  // }

  // 5. GET ALL USERS AVEC FILTRES & PAGINATION
async findAll(query: QueryUserDto) {
  try {
    const page: number = query.page != null ? Number(query.page) : 1;
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
        { lastName: { contains: q } },
        { email: { contains: q } },
        { phone: { contains: q } },
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

          feedbacksMed: {
            take: 3,
            orderBy: { createdAt: 'desc' },
            include: {
              patient: { select: { userId: true, firstName: true, lastName: true, profile: true } },
            },
          },
          feedbacksPat: {
            take: 3,
            orderBy: { createdAt: 'desc' },
            include: {
              medecin: { select: { userId: true, firstName: true, lastName: true, profile: true } },
            },
          },
          plannings: { take: 1, orderBy: { createdAt: 'desc' } },
          soldes: { take: 1, orderBy: { updatedAt: 'desc' } },
          reservationsM: {
            take: 3,
            orderBy: { createdAt: 'desc' },
            include: {  // Change from 'select' to 'include'
              patient: { select: { userId: true, firstName: true, lastName: true, profile: true } },
            },
          },
          ordonnancesM: {
            take: 3,
            orderBy: { createdAt: 'desc' },
            include: {  // Change from 'select' to 'include'
              patient: { select: { userId: true, firstName: true, lastName: true, profile: true } },
            },
          },
          abonnementsM: {
            take: 3,
            orderBy: { createdAt: 'desc' },
            include: {  // Change from 'select' to 'include'
              patient: { select: { userId: true, firstName: true, lastName: true, profile: true } },
            },
          },
          videos: {
            take: 3,
            orderBy: { createdAt: 'desc' },
            select: {
              videoId: true,
              title: true,
              path: true,
              category: true,
              createdAt: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { firstName: 'asc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    const medecinIds = items.filter(u => u.userType === UserType.MEDECIN).map(u => u.userId);
    let ratingMap = new Map<number, { average: number; count: number }>();
    if (medecinIds.length) {
      const rows = await this.prisma.feedback.groupBy({
        by: ['medecinId'],
        where: { medecinId: { in: medecinIds } },
        _avg: { note: true },
        _count: { _all: true },
      });
      ratingMap = new Map(
        rows.map(r => [r.medecinId, { average: r._avg.note ?? 0, count: r._count._all }]),
      );
    }

    const items1 = items.map(
      ({
        password,
        plannings,
        soldes,
        feedbacksMed,
        feedbacksPat,
        reservationsM,
        ordonnancesM,
        abonnementsM,
        videos,
        ...safe
      }) => ({
        ...safe,
        planning: plannings?.[0] ?? null,
        solde: soldes?.[0] ?? null,
        feedbackRating:
          safe.userType === UserType.MEDECIN
            ? ratingMap.get(safe.userId) ?? { average: 0, count: 0 }
            : null,
        lastFeedbacks:
          safe.userType === UserType.MEDECIN
            ? feedbacksMed
            : feedbacksPat,
        lastReservations: reservationsM ?? [],
        lastOrdonnances: ordonnancesM ?? [],
        lastAbonnements: abonnementsM ?? [],
        lastVideos: videos ?? [],
      }),
    );

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

  // 6. GET ONE USER BY ID AVEC RELATIONS
  // async findOne(id: number) {
  //   try {
  //     const user = await this.prisma.user.findUnique({
  //       where: { userId: id },
  //       include: {
  //         speciality: true,
  //         favoritesMed: true,
  //         favoritesPat: true,
  //         videos: {
  //           take: 3,
  //           orderBy: { createdAt: 'desc' },
  //           select: { videoId: true, title: true, path: true, category: true, createdAt: true },
  //         },
  //         reservationsM: {
  //           take: 3,
  //           orderBy: { createdAt: 'desc' },
  //           select: {
  //             reservationId: true,
  //             date: true,
  //             hour: true,
  //             status: true,
  //             patient: { select: { userId: true, firstName: true, lastName: true, profile: true } },
  //           },
  //         },
  //         ordonnancesM: {
  //           take: 3,
  //           orderBy: { createdAt: 'desc' },
  //           select: {
  //             ordonanceId: true,
  //             dureeTraitement: true,
  //             createdAt: true,
  //             patient: { select: { userId: true, firstName: true, lastName: true, profile: true } },
  //           },
  //         },
  //         abonnementsM: {
  //           take: 3,
  //           orderBy: { createdAt: 'desc' },
  //           select: {
  //             abonnementId: true,
  //             debutDate: true,
  //             endDate: true,
  //             numberOfTimePlanReservation: true,
  //             status: true,
  //             amount: true,
  //             transactionId: true,
  //             createdAt: true,
  //             medecin: { select: { userId: true, firstName: true, lastName: true, email: true } },
  //             patient: { select: { userId: true, firstName: true, lastName: true, email: true } },
  //           },
  //         },
  //         abonnementsP: {
  //           take: 3,
  //           orderBy: { createdAt: 'desc' },
  //           select: {
  //             abonnementId: true,
  //             debutDate: true,
  //             endDate: true,
  //             numberOfTimePlanReservation: true,
  //             status: true,
  //             amount: true,
  //             transactionId: true,
  //             createdAt: true,
  //             medecin: { select: { userId: true, firstName: true, lastName: true, email: true } },
  //             patient: { select: { userId: true, firstName: true, lastName: true, email: true } },
  //           },
  //         },
  //         feedbacksMed: {
  //           take: 3,
  //           orderBy: { createdAt: 'desc' },
  //           include: {
  //             patient: { select: { userId: true, firstName: true, lastName: true, profile: true } },
  //           },
  //         },
  //         feedbacksPat: {
  //           take: 3,
  //           orderBy: { createdAt: 'asc' },
  //           include: {
  //             medecin: { select: { userId: true, firstName: true, lastName: true, profile: true } },
  //           },
  //         },
  //         roles: { include: { role: true } },
  //         plannings: { take: 1, orderBy: { createdAt: 'desc' } },
  //         soldes: { take: 1, orderBy: { updatedAt: 'desc' } },
  //         reservationsP: true,
  //         ordonnancesP: true,
  //       },
  //     });

  //     if (!user) {
  //       throw new NotFoundException({
  //         message: `Utilisateur d'ID ${id} introuvable.`,
  //         messageE: `User with ID ${id} not found.`,
  //       });
  //     }

  //     let feedbackRating: { average: number; count: number } | null = null;
  //     if (user.userType === UserType.MEDECIN) {
  //       const agg = await this.prisma.feedback.aggregate({
  //         where: { medecinId: id },
  //         _avg: { note: true },
  //         _count: { _all: true },
  //       });
  //       feedbackRating = {
  //         average: agg._avg.note ?? 0,
  //         count: agg._count._all,
  //       };
  //     }

  //     const {
  //       password,
  //       plannings,
  //       soldes,
  //       feedbacksMed,
  //       feedbacksPat,
  //       reservationsM,
  //       ordonnancesM,
  //       abonnementsM,
  //       videos,
  //       ...user1
  //     } = user;

  //     return {
  //       ...user1,
  //       planning: plannings?.[0] ?? null,
  //       solde: soldes?.[0] ?? null,
  //       feedbackRating,
  //       lastFeedbacks: user.userType === UserType.MEDECIN ? feedbacksMed : feedbacksPat,
  //       lastReservations: reservationsM ?? [],
  //       lastOrdonnances: ordonnancesM ?? [],
  //       lastAbonnements: abonnementsM ?? [],
  //       lastVideos: videos ?? [],
  //     };
  //   } catch (error) {
  //     if (error instanceof NotFoundException) throw error;
  //     throw new BadRequestException({
  //       message: `Erreur récupération : ${error.message}`,
  //       messageE: `Error fetching user: ${error.message}`,
  //     });
  //   }
  // }
// 6. GET ONE USER BY ID AVEC RELATIONS
async findOne(id: number) {
  try {
    const user = await this.prisma.user.findUnique({
      where: { userId: id },
      include: {
        speciality: true,
        favoritesMed: true,
        favoritesPat: true,
        videos: {
          take: 3,
          orderBy: { createdAt: 'desc' },
          select: { videoId: true, title: true, path: true, category: true, createdAt: true },
        },
        reservationsM: {
          take: 3,
          orderBy: { createdAt: 'desc' },
          include: {  // Changé de select à include
            patient: { select: { userId: true, firstName: true, lastName: true, profile: true } },
          },
        },
        ordonnancesM: {
          take: 3,
          orderBy: { createdAt: 'desc' },
          include: {  // Changé de select à include
            patient: { select: { userId: true, firstName: true, lastName: true, profile: true } },
          },
        },
        abonnementsM: {
          take: 3,
          orderBy: { createdAt: 'desc' },
          include: {  // Changé de select à include
            medecin: { select: { userId: true, firstName: true, lastName: true, email: true } },
            patient: { select: { userId: true, firstName: true, lastName: true, email: true } },
          },
        },
        abonnementsP: {
          take: 3,
          orderBy: { createdAt: 'desc' },
          include: {  // Changé de select à include
            medecin: { select: { userId: true, firstName: true, lastName: true, email: true } },
            patient: { select: { userId: true, firstName: true, lastName: true, email: true } },
          },
        },
        feedbacksMed: {
          take: 3,
          orderBy: { createdAt: 'desc' },
          include: {
            patient: { select: { userId: true, firstName: true, lastName: true, profile: true } },
          },
        },
        feedbacksPat: {
          take: 3,
          orderBy: { createdAt: 'asc' },
          include: {
            medecin: { select: { userId: true, firstName: true, lastName: true, profile: true } },
          },
        },
        roles: { include: { role: true } },
        plannings: { take: 1, orderBy: { createdAt: 'desc' } },
        soldes: { take: 1, orderBy: { updatedAt: 'desc' } },
        reservationsP: true,
        ordonnancesP: true,
      },
    });

    if (!user) {
      throw new NotFoundException({
        message: `Utilisateur d'ID ${id} introuvable.`,
        messageE: `User with ID ${id} not found.`,
      });
    }

    let feedbackRating: { average: number; count: number } | null = null;
    if (user.userType === UserType.MEDECIN) {
      const agg = await this.prisma.feedback.aggregate({
        where: { medecinId: id },
        _avg: { note: true },
        _count: { _all: true },
      });
      feedbackRating = {
        average: agg._avg.note ?? 0,
        count: agg._count._all,
      };
    }

    const {
      password,
      plannings,
      soldes,
      feedbacksMed,
      feedbacksPat,
      reservationsM,
      ordonnancesM,
      abonnementsM,
      abonnementsP,
      videos,
      ...user1
    } = user;

    return {
      ...user1,
      planning: plannings?.[0] ?? null,
      solde: soldes?.[0] ?? null,
      feedbackRating,
      lastFeedbacks: user.userType === UserType.MEDECIN ? feedbacksMed : feedbacksPat,
      lastReservations: reservationsM ?? [],
      lastOrdonnances: ordonnancesM ?? [],
      lastAbonnements: abonnementsM ?? [],
      lastVideos: videos ?? [],
      // Si vous voulez aussi inclure abonnementsP dans la réponse
      abonnementsPatient: abonnementsP ?? [],
    };
  } catch (error) {
    if (error instanceof NotFoundException) throw error;
    throw new BadRequestException({
      message: `Erreur récupération : ${error.message}`,
      messageE: `Error fetching user: ${error.message}`,
    });
  }
}
  // 7. SIGNUP ADMIN
  async signupAdmin(dto: CreateAdminDto) {
    try {
      const userType = dto.isSuperAdmin ? UserType.SUPERADMIN : UserType.ADMIN;
      
      // Vérifier l'unicité pour le type ADMIN/SUPERADMIN
      await this.checkUniqueEmailAndPhone(dto.email, dto.phone, userType);

      const hashedPassword = await bcrypt.hash(dto.password, 10);

      const admin = await this.prisma.user.create({
        data: {
          firstName: dto.firstName,
          lastName: dto.lastName,
          sex: dto.sex,
          email: dto.email,
          phone: dto.phone,
          password: hashedPassword,
          userType,
          acceptPrivacy: true,
        },
      });

      if (dto.roleIds?.length) {
        const roles = await this.prisma.role.findMany({
          where: { roleId: { in: dto.roleIds } },
        });

        const validRoleIds = roles.map(r => r.roleId);
        const data = validRoleIds.map(roleId => ({
          userId: admin.userId,
          roleId,
        }));

        if (data.length) {
          await this.prisma.userRole.createMany({
            data,
            skipDuplicates: true,
          });
        }
      }

      return this.findOne(admin.userId);
    } catch (error) {
      if (error instanceof ConflictException) throw error;
      throw new BadRequestException({
        message: `Erreur création administrateur : ${error.message}`,
        messageE: `Error creating admin: ${error.message}`,
      });
    }
  }

  // 8. AJOUTER UN RÔLE À UN ADMIN
  async addRoleToAdmin(userId: number, roleId: number) {
    const user = await this.prisma.user.findUnique({ where: { userId } });
    if (!user || (user.userType !== UserType.ADMIN && user.userType !== UserType.SUPERADMIN)) {
      throw new BadRequestException({
        message: `L'utilisateur ${userId} n'est pas un administrateur.`,
        messageE: `User ${userId} is not an admin.`,
      });
    }

    const role = await this.prisma.role.findUnique({ where: { roleId } });
    if (!role) {
      throw new NotFoundException({
        message: `Rôle d'ID ${roleId} introuvable.`,
        messageE: `Role with ID ${roleId} not found.`,
      });
    }

    await this.prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId,
          roleId,
        },
      },
      update: {},
      create: {
        userId,
        roleId,
      },
    });

    return { message: 'Rôle attribué.', userId, roleId };
  }

  // 9. RETIRER UN RÔLE À UN ADMIN
  async removeRoleFromAdmin(userId: number, roleId: number) {
    const role = await this.prisma.role.findUnique({ where: { roleId } });
    if (!role) {
      throw new NotFoundException({
        message: `Rôle d'ID ${roleId} introuvable.`,
        messageE: `Role with ID ${roleId} not found.`,
      });
    }

    await this.prisma.userRole.delete({
      where: {
        userId_roleId: {
          userId,
          roleId,
        },
      },
    });

    return { message: 'Rôle retiré.', userId, roleId };
  }
}
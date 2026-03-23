// import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
// import { PrismaService } from '../prisma/prisma.service';
// import { CreateHopitalDto } from './dto/create-hopital.dto';
// import { UpdateHopitalDto } from './dto/update-hopital.dto';
// import { HopitalQueryDto } from './dto/hopital-query.dto';
// import { UserType } from 'generated/prisma';
// import * as bcrypt from 'bcryptjs';
// import { uploadImageToCloudinary } from '../utils/cloudinary';
// import { AddMedecinsDto, RemoveMedecinsDto } from './dto/add-medecin.dto';

// @Injectable()
// export class HopitalService {
//   constructor(private readonly prisma: PrismaService) {}

//   // Helper pour uploader le profil si base64
//   private async uploadProfileIfNeeded(profile: string | undefined, hospitalName: string): Promise<string | undefined> {
//     if (!profile) return undefined;
//     try {
//       return await uploadImageToCloudinary(profile, `hopitals/${hospitalName.replace(/\s/g, '_')}`);
//     } catch (error) {
//       throw new BadRequestException({
//         message: `Erreur lors de l'upload de l'image: ${error.message}`,
//         messageE: `Error uploading image: ${error.message}`,
//       });
//     }
//   }

//   // 1.1 - Créer un compte hôpital
//   async create(dto: CreateHopitalDto) {
//     // Vérifier email unique
//     const byEmail = await this.prisma.user.findUnique({
//       where: { email: dto.email },
//     });
//     if (byEmail) {
//       throw new ConflictException({
//         message: `L'email '${dto.email}' est déjà utilisé.`,
//         messageE: `Email '${dto.email}' is already in use.`,
//       });
//     }

//     // Vérifier téléphone unique
//     const byPhone = await this.prisma.user.findFirst({
//       where: { phone: dto.phone },
//     });
//     if (byPhone) {
//       throw new ConflictException({
//         message: `Le téléphone '${dto.phone}' est déjà utilisé.`,
//         messageE: `Phone '${dto.phone}' is already in use.`,
//       });
//     }

//     const hashedPassword = await bcrypt.hash(dto.password, 10);
    
//     // Upload du profil si base64
//     const profileUrl = await this.uploadProfileIfNeeded(dto.profile, dto.firstName);

//     const hopital = await this.prisma.user.create({
//       data: {
//         firstName: dto.firstName,
//         lastName: dto.lastName || dto.city,
//         sex: dto.sex,
//         email: dto.email,
//         phone: dto.phone,
//         password: hashedPassword,
//         userType: UserType.HOPITAL,
//         city: dto.city,
//         address: dto.address,
//         profile: profileUrl,
//         hospitalName: dto.firstName,
//       },
//       select: {
//         userId: true,
//         firstName: true,
//         lastName: true,
//         email: true,
//         phone: true,
//         userType: true,
//         city: true,
//         address: true,
//         profile: true,
//         isVerified: true,
//         createdAt: true,
//       },
//     });

//     return {
//       message: 'Hôpital créé avec succès',
//       messageE: 'Hospital created successfully',
//       data: hopital,
//     };
//   }

//   // 1.2 - Récupérer tous les hôpitaux
//   async findAll(query: HopitalQueryDto) {
//     const page = query.page || 1;
//     const limit = query.limit || 20;
//     const skip = (page - 1) * limit;

//     const where: any = {
//       userType: UserType.HOPITAL,
//     };

//     if (query.search) {
//       where.OR = [
//         { firstName: { contains: query.search } },
//         { lastName: { contains: query.search } },
//         { email: { contains: query.search } },
//         { hospitalName: { contains: query.search } },
//       ];
//     }

//     if (query.city) {
//       where.city = { contains: query.city };
//     }

//     const [items, total] = await this.prisma.$transaction([
//       this.prisma.user.findMany({
//         where,
//         skip,
//         take: limit,
//         orderBy: { firstName: 'asc' },
//         select: {
//           userId: true,
//           firstName: true,
//           lastName: true,
//           email: true,
//           phone: true,
//           city: true,
//           address: true,
//           profile: true,
//           isVerified: true,
//           createdAt: true,
//           _count: {
//             select: {
//               medecinsAffilies: true,
//               reservationsHopital: true,
//             },
//           },
//         },
//       }),
//       this.prisma.user.count({ where }),
//     ]);

//     return {
//       message: 'Liste des hôpitaux récupérée avec succès',
//       messageE: 'Hospitals list retrieved successfully',
//       data: items,
//       meta: {
//         total,
//         page,
//         limit,
//         pageCount: Math.ceil(total / limit),
//       },
//     };
//   }

//   // 1.3 - Récupérer un hôpital par ID
//   async findOne(id: number) {
//     const hopital = await this.prisma.user.findUnique({
//       where: { userId: id, userType: UserType.HOPITAL },
//       include: {
//         medecinsAffilies: {
//           include: {
//             medecin: {
//               include: {
//                 speciality: true,
//               },
//             },
//           },
//         },
//         reservationsHopital: {
//           take: 10,
//           orderBy: { createdAt: 'desc' },
//           include: {
//             patient: {
//               select: {
//                 userId: true,
//                 firstName: true,
//                 lastName: true,
//                 phone: true,
//               },
//             },
//             medecin: {
//               select: {
//                 userId: true,
//                 firstName: true,
//                 lastName: true,
//                 speciality: true,
//               },
//             },
//           },
//         },
//       },
//     });

//     if (!hopital) {
//       throw new NotFoundException({
//         message: `Hôpital d'ID ${id} introuvable.`,
//         messageE: `Hospital with ID ${id} not found.`,
//       });
//     }

//     const { password, ...hopitalData } = hopital;

//     // Calcul des statistiques
//     const totalReservations = await this.prisma.reservation.count({
//       where: { hopitalId: id },
//     });

//     const reservationsAujourdhui = await this.prisma.reservation.count({
//       where: {
//         hopitalId: id,
//         date: new Date().toISOString().split('T')[0],
//       },
//     });

//     const revenusTotal = await this.prisma.reservation.aggregate({
//       where: { hopitalId: id, status: 'COMPLETED' },
//       _sum: { amount: true },
//     });

//     return {
//       message: 'Hôpital récupéré avec succès',
//       messageE: 'Hospital retrieved successfully',
//       data: {
//         ...hopitalData,
//         statistiques: {
//           totalMedecins: hopital.medecinsAffilies.length,
//           totalReservations,
//           reservationsAujourdhui,
//           revenusTotal: revenusTotal._sum.amount || 0,
//         },
//       },
//     };
//   }

//   // 1.4 - Mettre à jour un hôpital
//   async update(id: number, dto: UpdateHopitalDto) {
//     const hopital = await this.prisma.user.findUnique({
//       where: { userId: id, userType: UserType.HOPITAL },
//     });

//     if (!hopital) {
//       throw new NotFoundException({
//         message: `Hôpital d'ID ${id} introuvable.`,
//         messageE: `Hospital with ID ${id} not found.`,
//       });
//     }

//     // Vérifier email unique si modifié
//     if (dto.email && dto.email !== hopital.email) {
//       const other = await this.prisma.user.findUnique({
//         where: { email: dto.email },
//       });
//       if (other) {
//         throw new ConflictException({
//           message: `L'email '${dto.email}' est déjà utilisé.`,
//           messageE: `Email '${dto.email}' is already in use.`,
//         });
//       }
//     }

//     // Vérifier téléphone unique si modifié
//     if (dto.phone && dto.phone !== hopital.phone) {
//       const other = await this.prisma.user.findFirst({
//         where: { phone: dto.phone },
//       });
//       if (other) {
//         throw new ConflictException({
//           message: `Le téléphone '${dto.phone}' est déjà utilisé.`,
//           messageE: `Phone '${dto.phone}' is already in use.`,
//         });
//       }
//     }

//     let updateData: any = { ...dto };
    
//     // Hasher le mot de passe si modifié
//     if (dto.password) {
//       updateData.password = await bcrypt.hash(dto.password, 10);
//     }
    
//     // Upload du nouveau profil si base64
//     if (dto.profile) {
//       const profileUrl = await this.uploadProfileIfNeeded(dto.profile, dto.firstName || hopital.firstName);
//       updateData.profile = profileUrl;
//     }

//     const updated = await this.prisma.user.update({
//       where: { userId: id },
//       data: updateData,
//       select: {
//         userId: true,
//         firstName: true,
//         lastName: true,
//         email: true,
//         phone: true,
//         city: true,
//         address: true,
//         profile: true,
//         isVerified: true,
//         updatedAt: true,
//       },
//     });

//     return {
//       message: 'Hôpital mis à jour avec succès',
//       messageE: 'Hospital updated successfully',
//       data: updated,
//     };
//   }

//   // 1.5 - Ajouter plusieurs médecins à l'hôpital (ignore les doublons)
//   async addMedecins(hopitalId: number, dto: AddMedecinsDto) {
//     // Vérifier que l'hôpital existe
//     const hopital = await this.prisma.user.findUnique({
//       where: { userId: hopitalId, userType: UserType.HOPITAL },
//     });
//     if (!hopital) {
//       throw new NotFoundException({
//         message: `Hôpital d'ID ${hopitalId} introuvable.`,
//         messageE: `Hospital with ID ${hopitalId} not found.`,
//       });
//     }

//     // Vérifier que tous les médecins existent
//     const medecins = await this.prisma.user.findMany({
//       where: {
//         userId: { in: dto.medecinIds },
//         userType: UserType.MEDECIN,
//       },
//       select: { userId: true, firstName: true, lastName: true },
//     });

//     const foundIds = medecins.map(m => m.userId);
//     const notFoundIds = dto.medecinIds.filter(id => !foundIds.includes(id));
    
//     if (notFoundIds.length > 0) {
//       throw new NotFoundException({
//         message: `Médecins introuvables: ${notFoundIds.join(', ')}`,
//         messageE: `Doctors not found: ${notFoundIds.join(', ')}`,
//       });
//     }

//     // Récupérer les affiliations existantes
//     const existingAffiliations = await this.prisma.medecinHopital.findMany({
//       where: {
//         hopitalId,
//         medecinId: { in: dto.medecinIds },
//       },
//       select: { medecinId: true },
//     });

//     const existingIds = existingAffiliations.map(a => a.medecinId);
    
//     // Filtrer les médecins à ajouter (ceux qui ne sont pas déjà affiliés)
//     const newMedecinIds = dto.medecinIds.filter(id => !existingIds.includes(id));

//     if (newMedecinIds.length === 0) {
//       return {
//         message: 'Tous les médecins sont déjà affiliés.',
//         messageE: 'All doctors are already affiliated.',
//         added: [],
//         skipped: dto.medecinIds,
//       };
//     }

//     // Ajouter les nouveaux médecins
//     const created = await this.prisma.$transaction(
//       newMedecinIds.map(medecinId =>
//         this.prisma.medecinHopital.create({
//           data: {
//             medecinId,
//             hopitalId,
//           },
//           include: {
//             medecin: {
//               select: {
//                 userId: true,
//                 firstName: true,
//                 lastName: true,
//                 email: true,
//                 speciality: true,
//               },
//             },
//           },
//         })
//       )
//     );

//     return {
//       message: `${created.length} médecin(s) ajouté(s) avec succès. ${existingIds.length} déjà affilié(s) ignoré(s).`,
//       messageE: `${created.length} doctor(s) added successfully. ${existingIds.length} already affiliated ignored.`,
//       added: created,
//       skipped: existingIds,
//     };
//   }

//   // 1.6 - Retirer plusieurs médecins de l'hôpital (ignore les non-affiliés)
//   async removeMedecins(hopitalId: number, dto: RemoveMedecinsDto) {
//     // Vérifier que l'hôpital existe
//     const hopital = await this.prisma.user.findUnique({
//       where: { userId: hopitalId, userType: UserType.HOPITAL },
//     });
//     if (!hopital) {
//       throw new NotFoundException({
//         message: `Hôpital d'ID ${hopitalId} introuvable.`,
//         messageE: `Hospital with ID ${hopitalId} not found.`,
//       });
//     }

//     // Récupérer les affiliations existantes
//     const existingAffiliations = await this.prisma.medecinHopital.findMany({
//       where: {
//         hopitalId,
//         medecinId: { in: dto.medecinIds },
//       },
//       select: { medecinId: true },
//     });

//     const existingIds = existingAffiliations.map(a => a.medecinId);
//     const notAffiliatedIds = dto.medecinIds.filter(id => !existingIds.includes(id));

//     if (existingIds.length === 0) {
//       return {
//         message: 'Aucun médecin affilié trouvé.',
//         messageE: 'No affiliated doctors found.',
//         removed: [],
//         skipped: dto.medecinIds,
//       };
//     }

//     // Supprimer les affiliations existantes
//     await this.prisma.$transaction(
//       existingIds.map(medecinId =>
//         this.prisma.medecinHopital.delete({
//           where: {
//             medecinId_hopitalId: {
//               medecinId,
//               hopitalId,
//             },
//           },
//         })
//       )
//     );

//     return {
//       message: `${existingIds.length} médecin(s) retiré(s) avec succès. ${notAffiliatedIds.length} non affilié(s) ignoré(s).`,
//       messageE: `${existingIds.length} doctor(s) removed successfully. ${notAffiliatedIds.length} not affiliated ignored.`,
//       removed: existingIds,
//       skipped: notAffiliatedIds,
//     };
//   }

//   // 1.7 - Lister les médecins d'un hôpital
//   async getMedecins(hopitalId: number, page: number = 1, limit: number = 20) {
//     const hopital = await this.prisma.user.findUnique({
//       where: { userId: hopitalId, userType: UserType.HOPITAL },
//     });

//     if (!hopital) {
//       throw new NotFoundException({
//         message: `Hôpital d'ID ${hopitalId} introuvable.`,
//         messageE: `Hospital with ID ${hopitalId} not found.`,
//       });
//     }

//     const skip = (page - 1) * limit;

//     const [items, total] = await this.prisma.$transaction([
//       this.prisma.medecinHopital.findMany({
//         where: { hopitalId },
//         skip,
//         take: limit,
//         include: {
//           medecin: {
//             include: {
//               speciality: true,
//             },
//           },
//         },
//         orderBy: { createdAt: 'desc' },
//       }),
//       this.prisma.medecinHopital.count({ where: { hopitalId } }),
//     ]);

//     return {
//       message: 'Liste des médecins récupérée avec succès',
//       messageE: 'Doctors list retrieved successfully',
//       data: items,
//       meta: {
//         total,
//         page,
//         limit,
//         pageCount: Math.ceil(total / limit),
//       },
//     };
//   }

//   // 1.8 - Lister les réservations d'un hôpital
//   async getReservations(hopitalId: number, query: any) {
//     const hopital = await this.prisma.user.findUnique({
//       where: { userId: hopitalId, userType: UserType.HOPITAL },
//     });

//     if (!hopital) {
//       throw new NotFoundException({
//         message: `Hôpital d'ID ${hopitalId} introuvable.`,
//         messageE: `Hospital with ID ${hopitalId} not found.`,
//       });
//     }

//     const page = query.page || 1;
//     const limit = query.limit || 20;
//     const skip = (page - 1) * limit;

//     const where: any = { hopitalId };

//     if (query.status) {
//       where.status = query.status;
//     }

//     if (query.date) {
//       where.date = query.date;
//     }

//     const [items, total] = await this.prisma.$transaction([
//       this.prisma.reservation.findMany({
//         where,
//         skip,
//         take: limit,
//         include: {
//           patient: {
//             select: {
//               userId: true,
//               firstName: true,
//               lastName: true,
//               phone: true,
//             },
//           },
//           medecin: {
//             select: {
//               userId: true,
//               firstName: true,
//               lastName: true,
//               speciality: true,
//             },
//           },
//           transaction: true,
//         },
//         orderBy: { date: 'desc', hour: 'desc' },
//       }),
//       this.prisma.reservation.count({ where }),
//     ]);

//     return {
//       message: 'Liste des réservations récupérée avec succès',
//       messageE: 'Reservations list retrieved successfully',
//       data: items,
//       meta: {
//         total,
//         page,
//         limit,
//         pageCount: Math.ceil(total / limit),
//       },
//     };
//   }

//   // 1.9 - Statistiques de l'hôpital
//   async getStats(hopitalId: number) {
//     const hopital = await this.prisma.user.findUnique({
//       where: { userId: hopitalId, userType: UserType.HOPITAL },
//     });

//     if (!hopital) {
//       throw new NotFoundException({
//         message: `Hôpital d'ID ${hopitalId} introuvable.`,
//         messageE: `Hospital with ID ${hopitalId} not found.`,
//       });
//     }

//     const totalMedecins = await this.prisma.medecinHopital.count({
//       where: { hopitalId },
//     });

//     const totalReservations = await this.prisma.reservation.count({
//       where: { hopitalId },
//     });

//     const reservationsAujourdhui = await this.prisma.reservation.count({
//       where: {
//         hopitalId,
//         date: new Date().toISOString().split('T')[0],
//       },
//     });

//     // Réservations par mois (6 derniers mois)
//     const today = new Date();
//     const sixMonthsAgo = new Date();
//     sixMonthsAgo.setMonth(today.getMonth() - 5);
    
//     const reservationsByMonth = await this.prisma.$queryRaw`
//       SELECT 
//         DATE_FORMAT(STR_TO_DATE(date, '%Y-%m-%d'), '%Y-%m') as month,
//         COUNT(*) as count
//       FROM Reservation
//       WHERE hopitalId = ${hopitalId}
//         AND STR_TO_DATE(date, '%Y-%m-%d') >= ${sixMonthsAgo}
//       GROUP BY DATE_FORMAT(STR_TO_DATE(date, '%Y-%m-%d'), '%Y-%m')
//       ORDER BY month DESC
//     `;

//     const revenusTotal = await this.prisma.reservation.aggregate({
//       where: { hopitalId, status: 'COMPLETED' },
//       _sum: { amount: true },
//     });

//     // Revenus par mois
//     const revenusByMonth = await this.prisma.$queryRaw`
//       SELECT 
//         DATE_FORMAT(STR_TO_DATE(date, '%Y-%m-%d'), '%Y-%m') as month,
//         SUM(amount) as total
//       FROM Reservation
//       WHERE hopitalId = ${hopitalId}
//         AND status = 'COMPLETED'
//         AND STR_TO_DATE(date, '%Y-%m-%d') >= ${sixMonthsAgo}
//       GROUP BY DATE_FORMAT(STR_TO_DATE(date, '%Y-%m-%d'), '%Y-%m')
//       ORDER BY month DESC
//     `;

//     // Top médecins par nombre de réservations
//     const topMedecins = await this.prisma.$queryRaw`
//       SELECT 
//         m.userId as medecinId,
//         CONCAT(m.firstName, ' ', m.lastName) as nom,
//         COUNT(r.reservationId) as reservations,
//         SUM(r.amount) as revenus
//       FROM Reservation r
//       JOIN User m ON r.medecinId = m.userId
//       WHERE r.hopitalId = ${hopitalId}
//         AND r.status = 'COMPLETED'
//       GROUP BY m.userId, m.firstName, m.lastName
//       ORDER BY reservations DESC
//       LIMIT 5
//     `;

//     return {
//       message: 'Statistiques récupérées avec succès',
//       messageE: 'Statistics retrieved successfully',
//       data: {
//         totalMedecins,
//         totalReservations,
//         reservationsAujourdhui,
//         reservationsParMois: reservationsByMonth,
//         revenusTotal: revenusTotal._sum.amount || 0,
//         revenusParMois: revenusByMonth,
//         topMedecins,
//       },
//     };
//   }


// // Dans la classe HopitalService, ajouter cette méthode
// async findAllWithDoctorFilter(query: HopitalQueryDto, medecinId?: number) {
//   const page = query.page || 1;
//   const limit = query.limit || 20;
//   const skip = (page - 1) * limit;

//   const where: any = {
//     userType: UserType.HOPITAL,
//   };

//   // Filtrer par médecin si spécifié
//   if (medecinId) {
//     where.medecinsAffilies = {
//       some: {
//         medecinId: medecinId
//       }
//     };
//   }

//   if (query.search) {
//     where.OR = [
//       { firstName: { contains: query.search } },
//       { lastName: { contains: query.search } },
//       { email: { contains: query.search } },
//       { hospitalName: { contains: query.search } },
//     ];
//   }

//   if (query.city) {
//     where.city = { contains: query.city };
//   }

//   const [items, total] = await this.prisma.$transaction([
//     this.prisma.user.findMany({
//       where,
//       skip,
//       take: limit,
//       orderBy: { firstName: 'asc' },
//       select: {
//         userId: true,
//         firstName: true,
//         lastName: true,
//         email: true,
//         phone: true,
//         city: true,
//         address: true,
//         profile: true,
//         isVerified: true,
//         createdAt: true,
//         _count: {
//           select: {
//             medecinsAffilies: true,
//             reservationsHopital: true,
//           },
//         },
//       },
//     }),
//     this.prisma.user.count({ where }),
//   ]);

//   return {
//     message: 'Liste des hôpitaux récupérée avec succès',
//     messageE: 'Hospitals list retrieved successfully',
//     data: items,
//     meta: {
//       total,
//       page,
//       limit,
//       pageCount: Math.ceil(total / limit),
//     },
//   };
// }
// }

import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateHopitalDto } from './dto/create-hopital.dto';
import { UpdateHopitalDto } from './dto/update-hopital.dto';
import { HopitalQueryDto } from './dto/hopital-query.dto';
import { UserType } from 'generated/prisma';
import * as bcrypt from 'bcryptjs';
import { uploadImageToCloudinary } from '../utils/cloudinary';
import { AddMedecinsDto, RemoveMedecinsDto } from './dto/add-medecin.dto';

@Injectable()
export class HopitalService {
  constructor(private readonly prisma: PrismaService) {}

  // Helper pour uploader le profil si base64
  private async uploadProfileIfNeeded(profile: string | undefined, hospitalName: string): Promise<string | undefined> {
    if (!profile) return undefined;
    try {
      return await uploadImageToCloudinary(profile, `hopitals/${hospitalName.replace(/\s/g, '_')}`);
    } catch (error) {
      throw new BadRequestException({
        message: `Erreur lors de l'upload de l'image: ${error.message}`,
        messageE: `Error uploading image: ${error.message}`,
      });
    }
  }

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
        message: `Un hôpital avec l'email '${email}' existe déjà.`,
        messageE: `A hospital with email '${email}' already exists.`,
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
        message: `Un hôpital avec le téléphone '${phone}' existe déjà.`,
        messageE: `A hospital with phone '${phone}' already exists.`,
      });
    }
  }

  // 1.1 - Créer un compte hôpital
  async create(dto: CreateHopitalDto) {
    // Vérifier l'unicité pour le type HOPITAL
    await this.checkUniqueEmailAndPhone(dto.email, dto.phone, UserType.HOPITAL);

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    
    // Upload du profil si base64
    const profileUrl = await this.uploadProfileIfNeeded(dto.profile, dto.firstName);

    const hopital = await this.prisma.user.create({
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName || dto.city,
        sex: dto.sex,
        email: dto.email,
        phone: dto.phone,
        password: hashedPassword,
        userType: UserType.HOPITAL,
        city: dto.city,
        address: dto.address,
        profile: profileUrl,
        hospitalName: dto.firstName,
      },
      select: {
        userId: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        userType: true,
        city: true,
        address: true,
        profile: true,
        isVerified: true,
        createdAt: true,
      },
    });

    return {
      message: 'Hôpital créé avec succès',
      messageE: 'Hospital created successfully',
      data: hopital,
    };
  }

  // 1.2 - Récupérer tous les hôpitaux
  async findAll(query: HopitalQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      userType: UserType.HOPITAL,
    };

    if (query.search) {
      where.OR = [
        { firstName: { contains: query.search } },
        { lastName: { contains: query.search } },
        { email: { contains: query.search } },
        { hospitalName: { contains: query.search } },
      ];
    }

    if (query.city) {
      where.city = { contains: query.city };
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { firstName: 'asc' },
        select: {
          userId: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          city: true,
          address: true,
          profile: true,
          isVerified: true,
          createdAt: true,
          _count: {
            select: {
              medecinsAffilies: true,
              reservationsHopital: true,
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      message: 'Liste des hôpitaux récupérée avec succès',
      messageE: 'Hospitals list retrieved successfully',
      data: items,
      meta: {
        total,
        page,
        limit,
        pageCount: Math.ceil(total / limit),
      },
    };
  }

  // 1.3 - Récupérer un hôpital par ID
  async findOne(id: number) {
    const hopital = await this.prisma.user.findUnique({
      where: { userId: id, userType: UserType.HOPITAL },
      include: {
        medecinsAffilies: {
          include: {
            medecin: {
              include: {
                speciality: true,
              },
            },
          },
        },
        reservationsHopital: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            patient: {
              select: {
                userId: true,
                firstName: true,
                lastName: true,
                phone: true,
              },
            },
            medecin: {
              select: {
                userId: true,
                firstName: true,
                lastName: true,
                speciality: true,
              },
            },
          },
        },
      },
    });

    if (!hopital) {
      throw new NotFoundException({
        message: `Hôpital d'ID ${id} introuvable.`,
        messageE: `Hospital with ID ${id} not found.`,
      });
    }

    const { password, ...hopitalData } = hopital;

    // Calcul des statistiques
    const totalReservations = await this.prisma.reservation.count({
      where: { hopitalId: id },
    });

    const reservationsAujourdhui = await this.prisma.reservation.count({
      where: {
        hopitalId: id,
        date: new Date().toISOString().split('T')[0],
      },
    });

    const revenusTotal = await this.prisma.reservation.aggregate({
      where: { hopitalId: id, status: 'COMPLETED' },
      _sum: { amount: true },
    });

    return {
      message: 'Hôpital récupéré avec succès',
      messageE: 'Hospital retrieved successfully',
      data: {
        ...hopitalData,
        statistiques: {
          totalMedecins: hopital.medecinsAffilies.length,
          totalReservations,
          reservationsAujourdhui,
          revenusTotal: revenusTotal._sum.amount || 0,
        },
      },
    };
  }

  // 1.4 - Mettre à jour un hôpital
  async update(id: number, dto: UpdateHopitalDto) {
    const hopital = await this.prisma.user.findUnique({
      where: { userId: id, userType: UserType.HOPITAL },
    });

    if (!hopital) {
      throw new NotFoundException({
        message: `Hôpital d'ID ${id} introuvable.`,
        messageE: `Hospital with ID ${id} not found.`,
      });
    }

    // Vérifier l'unicité pour le type HOPITAL si email ou phone modifié
    if (dto.email || dto.phone) {
      await this.checkUniqueEmailAndPhone(
        dto.email || hopital.email,
        dto.phone || hopital.phone,
        UserType.HOPITAL,
        id
      );
    }

    let updateData: any = { ...dto };
    
    // Hasher le mot de passe si modifié
    if (dto.password) {
      updateData.password = await bcrypt.hash(dto.password, 10);
    }
    
    // Upload du nouveau profil si base64
    if (dto.profile) {
      const profileUrl = await this.uploadProfileIfNeeded(dto.profile, dto.firstName || hopital.firstName);
      updateData.profile = profileUrl;
    }

    const updated = await this.prisma.user.update({
      where: { userId: id },
      data: updateData,
      select: {
        userId: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        city: true,
        address: true,
        profile: true,
        isVerified: true,
        updatedAt: true,
      },
    });

    return {
      message: 'Hôpital mis à jour avec succès',
      messageE: 'Hospital updated successfully',
      data: updated,
    };
  }

  // 1.5 - Ajouter plusieurs médecins à l'hôpital (ignore les doublons)
  async addMedecins(hopitalId: number, dto: AddMedecinsDto) {
    // Vérifier que l'hôpital existe
    const hopital = await this.prisma.user.findUnique({
      where: { userId: hopitalId, userType: UserType.HOPITAL },
    });
    if (!hopital) {
      throw new NotFoundException({
        message: `Hôpital d'ID ${hopitalId} introuvable.`,
        messageE: `Hospital with ID ${hopitalId} not found.`,
      });
    }

    // Vérifier que tous les médecins existent
    const medecins = await this.prisma.user.findMany({
      where: {
        userId: { in: dto.medecinIds },
        userType: UserType.MEDECIN,
      },
      select: { userId: true, firstName: true, lastName: true },
    });

    const foundIds = medecins.map(m => m.userId);
    const notFoundIds = dto.medecinIds.filter(id => !foundIds.includes(id));
    
    if (notFoundIds.length > 0) {
      throw new NotFoundException({
        message: `Médecins introuvables: ${notFoundIds.join(', ')}`,
        messageE: `Doctors not found: ${notFoundIds.join(', ')}`,
      });
    }

    // Récupérer les affiliations existantes
    const existingAffiliations = await this.prisma.medecinHopital.findMany({
      where: {
        hopitalId,
        medecinId: { in: dto.medecinIds },
      },
      select: { medecinId: true },
    });

    const existingIds = existingAffiliations.map(a => a.medecinId);
    
    // Filtrer les médecins à ajouter (ceux qui ne sont pas déjà affiliés)
    const newMedecinIds = dto.medecinIds.filter(id => !existingIds.includes(id));

    if (newMedecinIds.length === 0) {
      return {
        message: 'Tous les médecins sont déjà affiliés.',
        messageE: 'All doctors are already affiliated.',
        added: [],
        skipped: dto.medecinIds,
      };
    }

    // Ajouter les nouveaux médecins
    const created = await this.prisma.$transaction(
      newMedecinIds.map(medecinId =>
        this.prisma.medecinHopital.create({
          data: {
            medecinId,
            hopitalId,
          },
          include: {
            medecin: {
              select: {
                userId: true,
                firstName: true,
                lastName: true,
                email: true,
                speciality: true,
              },
            },
          },
        })
      )
    );

    return {
      message: `${created.length} médecin(s) ajouté(s) avec succès. ${existingIds.length} déjà affilié(s) ignoré(s).`,
      messageE: `${created.length} doctor(s) added successfully. ${existingIds.length} already affiliated ignored.`,
      added: created,
      skipped: existingIds,
    };
  }

  // 1.6 - Retirer plusieurs médecins de l'hôpital (ignore les non-affiliés)
  async removeMedecins(hopitalId: number, dto: RemoveMedecinsDto) {
    // Vérifier que l'hôpital existe
    const hopital = await this.prisma.user.findUnique({
      where: { userId: hopitalId, userType: UserType.HOPITAL },
    });
    if (!hopital) {
      throw new NotFoundException({
        message: `Hôpital d'ID ${hopitalId} introuvable.`,
        messageE: `Hospital with ID ${hopitalId} not found.`,
      });
    }

    // Récupérer les affiliations existantes
    const existingAffiliations = await this.prisma.medecinHopital.findMany({
      where: {
        hopitalId,
        medecinId: { in: dto.medecinIds },
      },
      select: { medecinId: true },
    });

    const existingIds = existingAffiliations.map(a => a.medecinId);
    const notAffiliatedIds = dto.medecinIds.filter(id => !existingIds.includes(id));

    if (existingIds.length === 0) {
      return {
        message: 'Aucun médecin affilié trouvé.',
        messageE: 'No affiliated doctors found.',
        removed: [],
        skipped: dto.medecinIds,
      };
    }

    // Supprimer les affiliations existantes
    await this.prisma.$transaction(
      existingIds.map(medecinId =>
        this.prisma.medecinHopital.delete({
          where: {
            medecinId_hopitalId: {
              medecinId,
              hopitalId,
            },
          },
        })
      )
    );

    return {
      message: `${existingIds.length} médecin(s) retiré(s) avec succès. ${notAffiliatedIds.length} non affilié(s) ignoré(s).`,
      messageE: `${existingIds.length} doctor(s) removed successfully. ${notAffiliatedIds.length} not affiliated ignored.`,
      removed: existingIds,
      skipped: notAffiliatedIds,
    };
  }

  // 1.7 - Lister les médecins d'un hôpital
  async getMedecins(hopitalId: number, page: number = 1, limit: number = 20) {
    const hopital = await this.prisma.user.findUnique({
      where: { userId: hopitalId, userType: UserType.HOPITAL },
    });

    if (!hopital) {
      throw new NotFoundException({
        message: `Hôpital d'ID ${hopitalId} introuvable.`,
        messageE: `Hospital with ID ${hopitalId} not found.`,
      });
    }

    const skip = (page - 1) * limit;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.medecinHopital.findMany({
        where: { hopitalId },
        skip,
        take: limit,
        include: {
          medecin: {
            include: {
              speciality: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.medecinHopital.count({ where: { hopitalId } }),
    ]);

    return {
      message: 'Liste des médecins récupérée avec succès',
      messageE: 'Doctors list retrieved successfully',
      data: items,
      meta: {
        total,
        page,
        limit,
        pageCount: Math.ceil(total / limit),
      },
    };
  }

  // 1.8 - Lister les réservations d'un hôpital
  async getReservations(hopitalId: number, query: any) {
    const hopital = await this.prisma.user.findUnique({
      where: { userId: hopitalId, userType: UserType.HOPITAL },
    });

    if (!hopital) {
      throw new NotFoundException({
        message: `Hôpital d'ID ${hopitalId} introuvable.`,
        messageE: `Hospital with ID ${hopitalId} not found.`,
      });
    }

    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { hopitalId };

    if (query.status) {
      where.status = query.status;
    }

    if (query.date) {
      where.date = query.date;
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.reservation.findMany({
        where,
        skip,
        take: limit,
        include: {
          patient: {
            select: {
              userId: true,
              firstName: true,
              lastName: true,
              phone: true,
            },
          },
          medecin: {
            select: {
              userId: true,
              firstName: true,
              lastName: true,
              speciality: true,
            },
          },
          transaction: true,
        },
        orderBy: { date: 'desc', hour: 'desc' },
      }),
      this.prisma.reservation.count({ where }),
    ]);

    return {
      message: 'Liste des réservations récupérée avec succès',
      messageE: 'Reservations list retrieved successfully',
      data: items,
      meta: {
        total,
        page,
        limit,
        pageCount: Math.ceil(total / limit),
      },
    };
  }

  // 1.9 - Statistiques de l'hôpital
  async getStats(hopitalId: number) {
    const hopital = await this.prisma.user.findUnique({
      where: { userId: hopitalId, userType: UserType.HOPITAL },
    });

    if (!hopital) {
      throw new NotFoundException({
        message: `Hôpital d'ID ${hopitalId} introuvable.`,
        messageE: `Hospital with ID ${hopitalId} not found.`,
      });
    }

    const totalMedecins = await this.prisma.medecinHopital.count({
      where: { hopitalId },
    });

    const totalReservations = await this.prisma.reservation.count({
      where: { hopitalId },
    });

    const reservationsAujourdhui = await this.prisma.reservation.count({
      where: {
        hopitalId,
        date: new Date().toISOString().split('T')[0],
      },
    });

    // Réservations par mois (6 derniers mois)
    const today = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(today.getMonth() - 5);
    
    const reservationsByMonth = await this.prisma.$queryRaw`
      SELECT 
        DATE_FORMAT(STR_TO_DATE(date, '%Y-%m-%d'), '%Y-%m') as month,
        COUNT(*) as count
      FROM Reservation
      WHERE hopitalId = ${hopitalId}
        AND STR_TO_DATE(date, '%Y-%m-%d') >= ${sixMonthsAgo}
      GROUP BY DATE_FORMAT(STR_TO_DATE(date, '%Y-%m-%d'), '%Y-%m')
      ORDER BY month DESC
    `;

    const revenusTotal = await this.prisma.reservation.aggregate({
      where: { hopitalId, status: 'COMPLETED' },
      _sum: { amount: true },
    });

    // Revenus par mois
    const revenusByMonth = await this.prisma.$queryRaw`
      SELECT 
        DATE_FORMAT(STR_TO_DATE(date, '%Y-%m-%d'), '%Y-%m') as month,
        SUM(amount) as total
      FROM Reservation
      WHERE hopitalId = ${hopitalId}
        AND status = 'COMPLETED'
        AND STR_TO_DATE(date, '%Y-%m-%d') >= ${sixMonthsAgo}
      GROUP BY DATE_FORMAT(STR_TO_DATE(date, '%Y-%m-%d'), '%Y-%m')
      ORDER BY month DESC
    `;

    // Top médecins par nombre de réservations
    const topMedecins = await this.prisma.$queryRaw`
      SELECT 
        m.userId as medecinId,
        CONCAT(m.firstName, ' ', m.lastName) as nom,
        COUNT(r.reservationId) as reservations,
        SUM(r.amount) as revenus
      FROM Reservation r
      JOIN User m ON r.medecinId = m.userId
      WHERE r.hopitalId = ${hopitalId}
        AND r.status = 'COMPLETED'
      GROUP BY m.userId, m.firstName, m.lastName
      ORDER BY reservations DESC
      LIMIT 5
    `;

    return {
      message: 'Statistiques récupérées avec succès',
      messageE: 'Statistics retrieved successfully',
      data: {
        totalMedecins,
        totalReservations,
        reservationsAujourdhui,
        reservationsParMois: reservationsByMonth,
        revenusTotal: revenusTotal._sum.amount || 0,
        revenusParMois: revenusByMonth,
        topMedecins,
      },
    };
  }

  // 1.10 - Récupérer tous les hôpitaux avec filtre par médecin
  async findAllWithDoctorFilter(query: HopitalQueryDto, medecinId?: number) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      userType: UserType.HOPITAL,
    };

    // Filtrer par médecin si spécifié
    if (medecinId) {
      where.medecinsAffilies = {
        some: {
          medecinId: medecinId
        }
      };
    }

    if (query.search) {
      where.OR = [
        { firstName: { contains: query.search } },
        { lastName: { contains: query.search } },
        { email: { contains: query.search } },
        { hospitalName: { contains: query.search } },
      ];
    }

    if (query.city) {
      where.city = { contains: query.city };
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { firstName: 'asc' },
        select: {
          userId: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          city: true,
          address: true,
          profile: true,
          isVerified: true,
          createdAt: true,
          _count: {
            select: {
              medecinsAffilies: true,
              reservationsHopital: true,
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      message: 'Liste des hôpitaux récupérée avec succès',
      messageE: 'Hospitals list retrieved successfully',
      data: items,
      meta: {
        total,
        page,
        limit,
        pageCount: Math.ceil(total / limit),
      },
    };
  }
}
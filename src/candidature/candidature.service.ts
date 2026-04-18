// import {
//   BadRequestException,
//   ForbiddenException,
//   Injectable,
//   NotFoundException,
// } from '@nestjs/common';
// import { PrismaService } from '../prisma/prisma.service';
// import { CreateCandidatureDto } from './dto/create-candidature.dto';
// import { UpdateCandidatureDto } from './dto/update-candidature.dto';
// import { CandidatureQueryDto } from './dto/candidature-query.dto';
// import { CancelCandidatureDto } from './dto/cancel-candidature.dto';
// import {
//   CandidatureStatus,
//   Prisma,
//   UserType,
// } from 'generated/prisma';
// import { uploadImageToCloudinary } from '../utils/cloudinary';
// import { bi, isValidExpoToken, sendExpoPush } from 'src/utils/expo-push';

// @Injectable()
// export class CandidatureService {
//   constructor(private readonly prisma: PrismaService) {}

//   private async createNotification(
//     userId: number,
//     titleFr: string,
//     titleEn: string,
//     msgFr: string,
//     msgEn: string,
//   ) {
//     return this.prisma.notification.create({
//       data: {
//         userId,
//         title: bi(titleFr, titleEn),
//         message: bi(msgFr, msgEn),
//         isRead: false,
//       },
//     });
//   }

//   private async pushIfPossible(
//     expoToken: string | null | undefined,
//     titleFr: string,
//     titleEn: string,
//     msgFr: string,
//     msgEn: string,
//     data?: Record<string, any>,
//   ) {
//     if (!isValidExpoToken(expoToken)) return;

//     await sendExpoPush({
//       to: expoToken!,
//       sound: 'default',
//       title: bi(titleFr, titleEn),
//       body: bi(msgFr, msgEn),
//       data,
//       priority: 'high',
//     });
//   }

//   private async uploadFileIfNeeded(
//     file: string | undefined,
//     medecinName: string,
//   ): Promise<string | undefined> {
//     if (!file) return undefined;

//     try {
//       return await uploadImageToCloudinary(
//         file,
//         `candidatures/${medecinName.replace(/\s/g, '_')}`,
//       );
//     } catch (error) {
//       throw new BadRequestException({
//         message: `Erreur lors de l'upload du fichier: ${error.message}`,
//         messageE: `Error uploading file: ${error.message}`,
//       });
//     }
//   }

//   async create(dto: CreateCandidatureDto) {
//     const medecin = await this.prisma.user.findFirst({
//       where: {
//         userId: dto.medecinId,
//         userType: UserType.MEDECIN,
//       },
//       select: {
//         userId: true,
//         firstName: true,
//         lastName: true,
//         speciality: true,
//         expotoken: true,
//       },
//     });

//     if (!medecin) {
//       throw new NotFoundException({
//         message: `Médecin d'ID ${dto.medecinId} introuvable.`,
//         messageE: `Doctor with ID ${dto.medecinId} not found.`,
//       });
//     }

//     const uniqueHopitalIds = [...new Set(dto.hopitalIds)];

//     const hopitaux = await this.prisma.user.findMany({
//       where: {
//         userId: { in: uniqueHopitalIds },
//         userType: UserType.HOPITAL,
//       },
//       select: {
//         userId: true,
//         firstName: true,
//         hospitalName: true,
//         city: true,
//       },
//     });

//     const foundHopitalIds = hopitaux.map((h) => h.userId);
//     const missingHopitalIds = uniqueHopitalIds.filter(
//       (id) => !foundHopitalIds.includes(id),
//     );

//     if (missingHopitalIds.length > 0) {
//       throw new NotFoundException({
//         message: `Hôpital(s) introuvable(s): ${missingHopitalIds.join(', ')}`,
//         messageE: `Hospital(s) not found: ${missingHopitalIds.join(', ')}`,
//       });
//     }

//     const existingAffiliations = await this.prisma.medecinHopital.findMany({
//       where: {
//         medecinId: dto.medecinId,
//         hopitalId: { in: uniqueHopitalIds },
//       },
//       select: {
//         hopitalId: true,
//       },
//     });

//     const alreadyAffiliated = existingAffiliations.map((x) => x.hopitalId);

//     const existingPendingCandidatures = await this.prisma.candidature.findMany({
//       where: {
//         medecinId: dto.medecinId,
//         hopitalId: { in: uniqueHopitalIds },
//         status: CandidatureStatus.PENDING,
//       },
//       select: {
//         hopitalId: true,
//       },
//     });

//     const alreadyPending = existingPendingCandidatures.map((x) => x.hopitalId);

//     const hopitalIdsToCreate = uniqueHopitalIds.filter(
//       (id) => !alreadyAffiliated.includes(id) && !alreadyPending.includes(id),
//     );

//     if (hopitalIdsToCreate.length === 0) {
//       return {
//         message:
//           "Aucune candidature créée. Tous les hôpitaux sélectionnés sont soit déjà affiliés, soit déjà en attente.",
//         messageE:
//           'No application created. All selected hospitals are already affiliated or already pending.',
//         data: [],
//         skipped: {
//           alreadyAffiliated,
//           alreadyPending,
//         },
//       };
//     }

//     const uploadedFile = await this.uploadFileIfNeeded(
//       dto.file,
//       `${medecin.firstName}_${medecin.lastName}`,
//     );

//     const created = await this.prisma.$transaction(
//       hopitalIdsToCreate.map((hopitalId) =>
//         this.prisma.candidature.create({
//           data: {
//             description: dto.description,
//             file: uploadedFile!,
//             medecinId: dto.medecinId,
//             hopitalId,
//             status: CandidatureStatus.PENDING,
//           },
//           include: {
//             medecin: {
//               select: {
//                 userId: true,
//                 firstName: true,
//                 lastName: true,
//                 email: true,
//                 phone: true,
//                 profile: true,
//                 speciality: true,
//               },
//             },
//             hopital: {
//               select: {
//                 userId: true,
//                 firstName: true,
//                 hospitalName: true,
//                 city: true,
//                 address: true,
//                 profile: true,
//               },
//             },
//           },
//         }),
//       ),
//     );

//     return {
//       message: `${created.length} candidature(s) créée(s) avec succès.`,
//       messageE: `${created.length} application(s) created successfully.`,
//       data: created,
//       skipped: {
//         alreadyAffiliated,
//         alreadyPending,
//       },
//     };
//   }

//   async findAll(query: CandidatureQueryDto) {
//     const page = query.page || 1;
//     const limit = query.limit || 20;
//     const skip = (page - 1) * limit;

//     const where: Prisma.CandidatureWhereInput = {};

//     if (query.status) {
//       where.status = query.status;
//     }

//     if (query.medecinId) {
//       where.medecinId = query.medecinId;
//     }

//     if (query.hopitalId) {
//       where.hopitalId = query.hopitalId;
//     }

//     if (query.search?.trim()) {
//       const s = query.search.trim();

//       where.OR = [
//         { description: { contains: s } },
//         {
//           medecin: {
//             is: {
//               firstName: { contains: s },
//             },
//           },
//         },
//         {
//           medecin: {
//             is: {
//               lastName: { contains: s },
//             },
//           },
//         },
//         {
//           medecin: {
//             is: {
//               speciality: {
//                 is: {
//                   name: { contains: s },
//                 },
//               },
//             },
//           },
//         },
//         {
//           hopital: {
//             is: {
//               firstName: { contains: s },
//             },
//           },
//         },
//         {
//           hopital: {
//             is: {
//               hospitalName: { contains: s },
//             },
//           },
//         },
//         {
//           hopital: {
//             is: {
//               city: { contains: s },
//             },
//           },
//         },
//       ];
//     }

//     const [items, total] = await this.prisma.$transaction([
//       this.prisma.candidature.findMany({
//         where,
//         skip,
//         take: limit,
//         orderBy: { createdAt: 'desc' },
//         include: {
//           medecin: {
//             select: {
//               userId: true,
//               firstName: true,
//               lastName: true,
//               email: true,
//               phone: true,
//               city: true,
//               address: true,
//               profile: true,
//               speciality: true,
//             },
//           },
//           hopital: {
//             select: {
//               userId: true,
//               firstName: true,
//               hospitalName: true,
//               city: true,
//               address: true,
//               profile: true,
//             },
//           },
//         },
//       }),
//       this.prisma.candidature.count({ where }),
//     ]);

//     return {
//       message: 'Liste des candidatures récupérée avec succès',
//       messageE: 'Applications list retrieved successfully',
//       data: items,
//       meta: {
//         total,
//         page,
//         limit,
//         pageCount: Math.ceil(total / limit),
//       },
//     };
//   }

//   async findOne(id: number) {
//     const candidature = await this.prisma.candidature.findUnique({
//       where: { candidatureId: id },
//       include: {
//         medecin: {
//           select: {
//             userId: true,
//             firstName: true,
//             lastName: true,
//             sex: true,
//             email: true,
//             phone: true,
//             city: true,
//             address: true,
//             profile: true,
//             createdAt: true,
//             speciality: true,
//           },
//         },
//         hopital: {
//           select: {
//             userId: true,
//             firstName: true,
//             lastName: true,
//             hospitalName: true,
//             email: true,
//             phone: true,
//             city: true,
//             address: true,
//             profile: true,
//           },
//         },
//       },
//     });

//     if (!candidature) {
//       throw new NotFoundException({
//         message: `Candidature d'ID ${id} introuvable.`,
//         messageE: `Application with ID ${id} not found.`,
//       });
//     }

//     const [totalConsultations, averageFeedback, alreadyAffiliated] =
//       await this.prisma.$transaction([
//         this.prisma.reservation.count({
//           where: {
//             medecinId: candidature.medecinId,
//           },
//         }),
//         this.prisma.feedback.aggregate({
//           where: {
//             medecinId: candidature.medecinId,
//           },
//           _avg: {
//             note: true,
//           },
//         }),
//         this.prisma.medecinHopital.count({
//           where: {
//             medecinId: candidature.medecinId,
//             hopitalId: candidature.hopitalId,
//           },
//         }),
//       ]);

//     return {
//       message: 'Candidature récupérée avec succès',
//       messageE: 'Application retrieved successfully',
//       data: {
//         candidatureId: candidature.candidatureId,
//         description: candidature.description,
//         file: candidature.file,
//         status: candidature.status,
//         createdAt: candidature.createdAt,
//         updatedAt: candidature.updatedAt,
//         medecin: {
//           ...candidature.medecin,
//           averageFeedbackOnFive: Number(averageFeedback._avg.note ?? 0),
//           totalConsultations,
//         },
//         hopital: candidature.hopital,
//         alreadyAffiliated: alreadyAffiliated > 0,
//       },
//     };
//   }

//   async update(id: number, dto: UpdateCandidatureDto) {
//     const candidature = await this.prisma.candidature.findUnique({
//       where: { candidatureId: id },
//       include: {
//         medecin: {
//           select: {
//             firstName: true,
//             lastName: true,
//           },
//         },
//       },
//     });

//     if (!candidature) {
//       throw new NotFoundException({
//         message: `Candidature d'ID ${id} introuvable.`,
//         messageE: `Application with ID ${id} not found.`,
//       });
//     }

//     if (candidature.status !== CandidatureStatus.PENDING) {
//       throw new BadRequestException({
//         message:
//           'Seules les candidatures en attente peuvent être modifiées.',
//         messageE: 'Only pending applications can be updated.',
//       });
//     }

//     let uploadedFile: string | undefined = undefined;

//     if (dto.file) {
//       uploadedFile = await this.uploadFileIfNeeded(
//         dto.file,
//         `${candidature.medecin.firstName}_${candidature.medecin.lastName}`,
//       );
//     }

//     const updated = await this.prisma.candidature.update({
//       where: { candidatureId: id },
//       data: {
//         description: dto.description ?? candidature.description,
//         file: uploadedFile ?? candidature.file,
//       },
//       include: {
//         medecin: {
//           select: {
//             userId: true,
//             firstName: true,
//             lastName: true,
//             speciality: true,
//           },
//         },
//         hopital: {
//           select: {
//             userId: true,
//             firstName: true,
//             hospitalName: true,
//             city: true,
//           },
//         },
//       },
//     });

//     return {
//       message: 'Candidature mise à jour avec succès',
//       messageE: 'Application updated successfully',
//       data: updated,
//     };
//   }

//   async delete(id: number) {
//     const candidature = await this.prisma.candidature.findUnique({
//       where: { candidatureId: id },
//     });

//     if (!candidature) {
//       throw new NotFoundException({
//         message: `Candidature d'ID ${id} introuvable.`,
//         messageE: `Application with ID ${id} not found.`,
//       });
//     }

//     await this.prisma.candidature.delete({
//       where: { candidatureId: id },
//     });

//     return {
//       message: 'Candidature supprimée avec succès',
//       messageE: 'Application deleted successfully',
//     };
//   }

//   async cancelMany(dto: CancelCandidatureDto) {
//     const candidatures = await this.prisma.candidature.findMany({
//       where: {
//         candidatureId: { in: dto.candidatureIds },
//       },
//       select: {
//         candidatureId: true,
//         status: true,
//       },
//     });

//     if (candidatures.length === 0) {
//       throw new NotFoundException({
//         message: 'Aucune candidature trouvée.',
//         messageE: 'No application found.',
//       });
//     }

//     const cancellableIds = candidatures
//       .filter((c) => c.status === CandidatureStatus.PENDING)
//       .map((c) => c.candidatureId);

//     const skippedIds = candidatures
//       .filter((c) => c.status !== CandidatureStatus.PENDING)
//       .map((c) => c.candidatureId);

//     if (cancellableIds.length > 0) {
//       await this.prisma.candidature.updateMany({
//         where: {
//           candidatureId: { in: cancellableIds },
//         },
//         data: {
//           status: CandidatureStatus.CANCELLED,
//         },
//       });
//     }

//     return {
//       message: `${cancellableIds.length} candidature(s) annulée(s) avec succès.`,
//       messageE: `${cancellableIds.length} application(s) cancelled successfully.`,
//       cancelledIds: cancellableIds,
//       skippedIds,
//     };
//   }

//   async accept(id: number) {
//     const candidature = await this.prisma.candidature.findUnique({
//       where: { candidatureId: id },
//       include: {
//         medecin: {
//           select: {
//             userId: true,
//             firstName: true,
//             lastName: true,
//             expotoken: true,
//           },
//         },
//         hopital: {
//           select: {
//             userId: true,
//             firstName: true,
//             hospitalName: true,
//             city: true,
//           },
//         },
//       },
//     });

//     if (!candidature) {
//       throw new NotFoundException({
//         message: `Candidature d'ID ${id} introuvable.`,
//         messageE: `Application with ID ${id} not found.`,
//       });
//     }

//     if (candidature.status !== CandidatureStatus.PENDING) {
//       throw new BadRequestException({
//         message:
//           'Seules les candidatures en attente peuvent être acceptées.',
//         messageE: 'Only pending applications can be accepted.',
//       });
//     }

//     const result = await this.prisma.$transaction(async (tx) => {
//       await tx.medecinHopital.upsert({
//         where: {
//           medecinId_hopitalId: {
//             medecinId: candidature.medecinId,
//             hopitalId: candidature.hopitalId,
//           },
//         },
//         update: {},
//         create: {
//           medecinId: candidature.medecinId,
//           hopitalId: candidature.hopitalId,
//         },
//       });

//       return tx.candidature.update({
//         where: { candidatureId: id },
//         data: {
//           status: CandidatureStatus.CONFIRMED,
//         },
//         include: {
//           medecin: {
//             select: {
//               userId: true,
//               firstName: true,
//               lastName: true,
//               speciality: true,
//               expotoken: true,
//             },
//           },
//           hopital: {
//             select: {
//               userId: true,
//               firstName: true,
//               hospitalName: true,
//               city: true,
//             },
//           },
//         },
//       });
//     });

//     const hopitalLabel =
//       result.hopital?.hospitalName || result.hopital?.firstName || 'cet hôpital';

//     const titleFr = 'Candidature acceptée';
//     const titleEn = 'Application accepted';
//     const msgFr = `Votre candidature à "${hopitalLabel}" a été acceptée. Vous êtes maintenant affilié à cet hôpital.`;
//     const msgEn = `Your application to "${hopitalLabel}" has been accepted. You are now affiliated with this hospital.`;

//     void this.createNotification(
//       result.medecin.userId,
//       titleFr,
//       titleEn,
//       msgFr,
//       msgEn,
//     ).catch(() => void 0);

//     void this.pushIfPossible(
//       result.medecin.expotoken,
//       titleFr,
//       titleEn,
//       msgFr,
//       msgEn,
//       {
//         kind: 'CANDIDATURE_ACCEPTED',
//         candidatureId: result.candidatureId,
//         medecinId: result.medecinId,
//         hopitalId: result.hopitalId,
//       },
//     ).catch(() => void 0);

//     return {
//       message:
//         'Candidature acceptée avec succès, affiliation créée et médecin notifié.',
//       messageE:
//         'Application accepted successfully, affiliation created and doctor notified.',
//       data: result,
//     };
//   }

//   async reject(id: number) {
//     const candidature = await this.prisma.candidature.findUnique({
//       where: { candidatureId: id },
//       include: {
//         medecin: {
//           select: {
//             userId: true,
//             firstName: true,
//             lastName: true,
//             expotoken: true,
//           },
//         },
//         hopital: {
//           select: {
//             userId: true,
//             firstName: true,
//             hospitalName: true,
//             city: true,
//           },
//         },
//       },
//     });

//     if (!candidature) {
//       throw new NotFoundException({
//         message: `Candidature d'ID ${id} introuvable.`,
//         messageE: `Application with ID ${id} not found.`,
//       });
//     }

//     if (candidature.status !== CandidatureStatus.PENDING) {
//       throw new BadRequestException({
//         message:
//           'Seules les candidatures en attente peuvent être refusées.',
//         messageE: 'Only pending applications can be rejected.',
//       });
//     }

//     const medecinId = candidature.medecin.userId;
//     const medecinExpoToken = candidature.medecin.expotoken;
//     const hopitalId = candidature.hopitalId;
//     const hopitalLabel =
//       candidature.hopital?.hospitalName ||
//       candidature.hopital?.firstName ||
//       'cet hôpital';

//     await this.prisma.candidature.delete({
//       where: { candidatureId: id },
//     });

//     const titleFr = 'Candidature rejetée';
//     const titleEn = 'Application rejected';
//     const msgFr = `Votre candidature à "${hopitalLabel}" a été rejetée.`;
//     const msgEn = `Your application to "${hopitalLabel}" has been rejected.`;

//     void this.createNotification(
//       medecinId,
//       titleFr,
//       titleEn,
//       msgFr,
//       msgEn,
//     ).catch(() => void 0);

//     void this.pushIfPossible(
//       medecinExpoToken,
//       titleFr,
//       titleEn,
//       msgFr,
//       msgEn,
//       {
//         kind: 'CANDIDATURE_REJECTED',
//         candidatureId: id,
//         medecinId,
//         hopitalId,
//       },
//     ).catch(() => void 0);

//     return {
//       message: 'Candidature refusée, supprimée et médecin notifié avec succès',
//       messageE: 'Application rejected, deleted and doctor notified successfully',
//     };
//   }
// }

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCandidatureDto } from './dto/create-candidature.dto';
import { UpdateCandidatureDto } from './dto/update-candidature.dto';
import { CandidatureQueryDto } from './dto/candidature-query.dto';
import { CancelCandidatureDto } from './dto/cancel-candidature.dto';
import {
  CandidatureStatus,
  Prisma,
  UserType,
} from 'generated/prisma';
import { uploadImageToCloudinary } from '../utils/cloudinary';
import { bi, isValidExpoToken, sendExpoPush } from 'src/utils/expo-push';
import * as sharp from 'sharp';

@Injectable()
export class CandidatureService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Compresse une image à 1 MB maximum
   */
  private async compressImageTo1MB(base64Image: string): Promise<string> {
    try {
      // Vérifier si c'est une image base64 valide
      if (!base64Image.startsWith('data:image/')) {
        console.log('Image already in URL format or not base64, skipping compression');
        return base64Image;
      }

      // Extraire le type MIME et les données
      const matches = base64Image.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
      
      if (!matches) {
        console.log('Invalid base64 format, skipping compression');
        return base64Image;
      }

      const format = matches[1]; // png, jpeg, jpg, webp, etc.
      const base64Data = matches[2];
      
      // Calculer la taille actuelle
      let currentSizeKB = Buffer.from(base64Data, 'base64').length / 1024;
      console.log(`Taille actuelle: ${currentSizeKB.toFixed(2)} KB`);

      // Si déjà <= 1 MB, retourner l'image originale
      if (currentSizeKB <= 1024) {
        console.log('Image déjà <= 1 MB, pas de compression nécessaire');
        return base64Image;
      }

      // Convertir base64 en buffer
      const buffer = Buffer.from(base64Data, 'base64');

      // Configuration de compression
      let quality = 85;
      let compressedBuffer: Buffer;
      let compressedSizeKB: number;

      // Essayer avec JPEG (meilleure compression)
      compressedBuffer = await sharp(buffer)
        .jpeg({ quality, progressive: true })
        .toBuffer();
      
      compressedSizeKB = compressedBuffer.length / 1024;
      console.log(`Compression JPEG qualité ${quality}: ${compressedSizeKB.toFixed(2)} KB`);

      // Réduire la qualité jusqu'à atteindre 1 MB ou qualité minimum
      while (compressedSizeKB > 1024 && quality > 30) {
        quality -= 10;
        compressedBuffer = await sharp(buffer)
          .jpeg({ quality, progressive: true })
          .toBuffer();
        compressedSizeKB = compressedBuffer.length / 1024;
        console.log(`Compression JPEG qualité ${quality}: ${compressedSizeKB.toFixed(2)} KB`);
      }

      // Si toujours > 1 MB, réduire les dimensions
      if (compressedSizeKB > 1024) {
        console.log('Toujours > 1 MB, réduction des dimensions...');
        
        const metadata = await sharp(buffer).metadata();
        const scaleFactor = Math.sqrt(1024 / compressedSizeKB);
        const newWidth = Math.floor(metadata.width * scaleFactor);
        const newHeight = Math.floor(metadata.height * scaleFactor);
        
        console.log(`Redimensionnement: ${metadata.width}x${metadata.height} -> ${newWidth}x${newHeight}`);
        
        compressedBuffer = await sharp(buffer)
          .resize(newWidth, newHeight, {
            fit: 'inside',
            withoutEnlargement: true
          })
          .jpeg({ quality: 70, progressive: true })
          .toBuffer();
        
        compressedSizeKB = compressedBuffer.length / 1024;
        console.log(`Après redimensionnement: ${compressedSizeKB.toFixed(2)} KB`);
      }

      // Dernier recours: qualité très basse
      if (compressedSizeKB > 1024) {
        console.log('Dernier recours: qualité très basse...');
        compressedBuffer = await sharp(buffer)
          .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 50, progressive: true })
          .toBuffer();
        
        compressedSizeKB = compressedBuffer.length / 1024;
        console.log(`Ultime compression: ${compressedSizeKB.toFixed(2)} KB`);
      }

      // Convertir le buffer compressé en base64
      const outputFormat = 'jpeg';
      const compressedBase64 = `data:image/${outputFormat};base64,${compressedBuffer.toString('base64')}`;
      
      console.log(`✅ Compression réussie: ${currentSizeKB.toFixed(2)} KB -> ${compressedSizeKB.toFixed(2)} KB`);
      
      return compressedBase64;
      
    } catch (error) {
      console.error('Erreur lors de la compression:', error);
      return base64Image;
    }
  }

  /**
   * Vérifie la taille d'une image base64
   */
  private getBase64SizeInKB(base64String: string): number {
    if (!base64String.startsWith('data:image/')) return 0;
    
    const matches = base64String.match(/^data:image\/[a-zA-Z0-9]+;base64,(.+)$/);
    if (!matches) return 0;
    
    return Buffer.from(matches[1], 'base64').length / 1024;
  }

  private async createNotification(
    userId: number,
    titleFr: string,
    titleEn: string,
    msgFr: string,
    msgEn: string,
  ) {
    return this.prisma.notification.create({
      data: {
        userId,
        title: bi(titleFr, titleEn),
        message: bi(msgFr, msgEn),
        isRead: false,
      },
    });
  }

  private async pushIfPossible(
    expoToken: string | null | undefined,
    titleFr: string,
    titleEn: string,
    msgFr: string,
    msgEn: string,
    data?: Record<string, any>,
  ) {
    if (!isValidExpoToken(expoToken)) return;

    await sendExpoPush({
      to: expoToken!,
      sound: 'default',
      title: bi(titleFr, titleEn),
      body: bi(msgFr, msgEn),
      data,
      priority: 'high',
    });
  }

  private async uploadFileIfNeeded(
    file: string | undefined,
    medecinName: string,
  ): Promise<string | undefined> {
    if (!file) return undefined;

    try {
      let fileToUpload = file;
      
      // Vérifier et compresser les images base64
      if (fileToUpload.startsWith('data:image/')) {
        const initialSizeKB = this.getBase64SizeInKB(fileToUpload);
        console.log(`📸 Taille initiale de l'image: ${initialSizeKB.toFixed(2)} KB`);
        
        if (initialSizeKB > 1024) {
          console.log(`Image trop grande (${initialSizeKB.toFixed(2)} KB), compression en cours...`);
          fileToUpload = await this.compressImageTo1MB(fileToUpload);
          const newSizeKB = this.getBase64SizeInKB(fileToUpload);
          console.log(`✅ Compression terminée: ${initialSizeKB.toFixed(2)} KB -> ${newSizeKB.toFixed(2)} KB`);
        } else {
          console.log(`✅ Image déjà dans la limite (${initialSizeKB.toFixed(2)} KB <= 1024 KB)`);
        }
      }
      
      return await uploadImageToCloudinary(
        fileToUpload,
        `candidatures/${medecinName.replace(/\s/g, '_')}`,
      );
    } catch (error) {
      throw new BadRequestException({
        message: `Erreur lors de l'upload du fichier: ${error.message}`,
        messageE: `Error uploading file: ${error.message}`,
      });
    }
  }

  async create(dto: CreateCandidatureDto) {
    const medecin = await this.prisma.user.findFirst({
      where: {
        userId: dto.medecinId,
        userType: UserType.MEDECIN,
      },
      select: {
        userId: true,
        firstName: true,
        lastName: true,
        speciality: true,
        expotoken: true,
      },
    });

    if (!medecin) {
      throw new NotFoundException({
        message: `Médecin d'ID ${dto.medecinId} introuvable.`,
        messageE: `Doctor with ID ${dto.medecinId} not found.`,
      });
    }

    const uniqueHopitalIds = [...new Set(dto.hopitalIds)];

    const hopitaux = await this.prisma.user.findMany({
      where: {
        userId: { in: uniqueHopitalIds },
        userType: UserType.HOPITAL,
      },
      select: {
        userId: true,
        firstName: true,
        hospitalName: true,
        city: true,
      },
    });

    const foundHopitalIds = hopitaux.map((h) => h.userId);
    const missingHopitalIds = uniqueHopitalIds.filter(
      (id) => !foundHopitalIds.includes(id),
    );

    if (missingHopitalIds.length > 0) {
      throw new NotFoundException({
        message: `Hôpital(s) introuvable(s): ${missingHopitalIds.join(', ')}`,
        messageE: `Hospital(s) not found: ${missingHopitalIds.join(', ')}`,
      });
    }

    const existingAffiliations = await this.prisma.medecinHopital.findMany({
      where: {
        medecinId: dto.medecinId,
        hopitalId: { in: uniqueHopitalIds },
      },
      select: {
        hopitalId: true,
      },
    });

    const alreadyAffiliated = existingAffiliations.map((x) => x.hopitalId);

    const existingPendingCandidatures = await this.prisma.candidature.findMany({
      where: {
        medecinId: dto.medecinId,
        hopitalId: { in: uniqueHopitalIds },
        status: CandidatureStatus.PENDING,
      },
      select: {
        hopitalId: true,
      },
    });

    const alreadyPending = existingPendingCandidatures.map((x) => x.hopitalId);

    const hopitalIdsToCreate = uniqueHopitalIds.filter(
      (id) => !alreadyAffiliated.includes(id) && !alreadyPending.includes(id),
    );

    if (hopitalIdsToCreate.length === 0) {
      return {
        message:
          "Aucune candidature créée. Tous les hôpitaux sélectionnés sont soit déjà affiliés, soit déjà en attente.",
        messageE:
          'No application created. All selected hospitals are already affiliated or already pending.',
        data: [],
        skipped: {
          alreadyAffiliated,
          alreadyPending,
        },
      };
    }

    const uploadedFile = await this.uploadFileIfNeeded(
      dto.file,
      `${medecin.firstName}_${medecin.lastName}`,
    );

    const created = await this.prisma.$transaction(
      hopitalIdsToCreate.map((hopitalId) =>
        this.prisma.candidature.create({
          data: {
            description: dto.description,
            file: uploadedFile!,
            medecinId: dto.medecinId,
            hopitalId,
            status: CandidatureStatus.PENDING,
          },
          include: {
            medecin: {
              select: {
                userId: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                profile: true,
                speciality: true,
              },
            },
            hopital: {
              select: {
                userId: true,
                firstName: true,
                hospitalName: true,
                city: true,
                address: true,
                profile: true,
              },
            },
          },
        }),
      ),
    );

    return {
      message: `${created.length} candidature(s) créée(s) avec succès.`,
      messageE: `${created.length} application(s) created successfully.`,
      data: created,
      skipped: {
        alreadyAffiliated,
        alreadyPending,
      },
    };
  }

  async findAll(query: CandidatureQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.CandidatureWhereInput = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.medecinId) {
      where.medecinId = query.medecinId;
    }

    if (query.hopitalId) {
      where.hopitalId = query.hopitalId;
    }

    if (query.search?.trim()) {
      const s = query.search.trim();

      where.OR = [
        { description: { contains: s } },
        {
          medecin: {
            is: {
              firstName: { contains: s },
            },
          },
        },
        {
          medecin: {
            is: {
              lastName: { contains: s },
            },
          },
        },
        {
          medecin: {
            is: {
              speciality: {
                is: {
                  name: { contains: s },
                },
              },
            },
          },
        },
        {
          hopital: {
            is: {
              firstName: { contains: s },
            },
          },
        },
        {
          hopital: {
            is: {
              hospitalName: { contains: s },
            },
          },
        },
        {
          hopital: {
            is: {
              city: { contains: s },
            },
          },
        },
      ];
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.candidature.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          medecin: {
            select: {
              userId: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              city: true,
              address: true,
              profile: true,
              speciality: true,
            },
          },
          hopital: {
            select: {
              userId: true,
              firstName: true,
              hospitalName: true,
              city: true,
              address: true,
              profile: true,
            },
          },
        },
      }),
      this.prisma.candidature.count({ where }),
    ]);

    return {
      message: 'Liste des candidatures récupérée avec succès',
      messageE: 'Applications list retrieved successfully',
      data: items,
      meta: {
        total,
        page,
        limit,
        pageCount: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number) {
    const candidature = await this.prisma.candidature.findUnique({
      where: { candidatureId: id },
      include: {
        medecin: {
          select: {
            userId: true,
            firstName: true,
            lastName: true,
            sex: true,
            email: true,
            phone: true,
            city: true,
            address: true,
            profile: true,
            createdAt: true,
            speciality: true,
          },
        },
        hopital: {
          select: {
            userId: true,
            firstName: true,
            lastName: true,
            hospitalName: true,
            email: true,
            phone: true,
            city: true,
            address: true,
            profile: true,
          },
        },
      },
    });

    if (!candidature) {
      throw new NotFoundException({
        message: `Candidature d'ID ${id} introuvable.`,
        messageE: `Application with ID ${id} not found.`,
      });
    }

    const [totalConsultations, averageFeedback, alreadyAffiliated] =
      await this.prisma.$transaction([
        this.prisma.reservation.count({
          where: {
            medecinId: candidature.medecinId,
          },
        }),
        this.prisma.feedback.aggregate({
          where: {
            medecinId: candidature.medecinId,
          },
          _avg: {
            note: true,
          },
        }),
        this.prisma.medecinHopital.count({
          where: {
            medecinId: candidature.medecinId,
            hopitalId: candidature.hopitalId,
          },
        }),
      ]);

    return {
      message: 'Candidature récupérée avec succès',
      messageE: 'Application retrieved successfully',
      data: {
        candidatureId: candidature.candidatureId,
        description: candidature.description,
        file: candidature.file,
        status: candidature.status,
        createdAt: candidature.createdAt,
        updatedAt: candidature.updatedAt,
        medecin: {
          ...candidature.medecin,
          averageFeedbackOnFive: Number(averageFeedback._avg.note ?? 0),
          totalConsultations,
        },
        hopital: candidature.hopital,
        alreadyAffiliated: alreadyAffiliated > 0,
      },
    };
  }

  async update(id: number, dto: UpdateCandidatureDto) {
    const candidature = await this.prisma.candidature.findUnique({
      where: { candidatureId: id },
      include: {
        medecin: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!candidature) {
      throw new NotFoundException({
        message: `Candidature d'ID ${id} introuvable.`,
        messageE: `Application with ID ${id} not found.`,
      });
    }

    if (candidature.status !== CandidatureStatus.PENDING) {
      throw new BadRequestException({
        message:
          'Seules les candidatures en attente peuvent être modifiées.',
        messageE: 'Only pending applications can be updated.',
      });
    }

    let uploadedFile: string | undefined = undefined;

    if (dto.file) {
      uploadedFile = await this.uploadFileIfNeeded(
        dto.file,
        `${candidature.medecin.firstName}_${candidature.medecin.lastName}`,
      );
    }

    const updated = await this.prisma.candidature.update({
      where: { candidatureId: id },
      data: {
        description: dto.description ?? candidature.description,
        file: uploadedFile ?? candidature.file,
      },
      include: {
        medecin: {
          select: {
            userId: true,
            firstName: true,
            lastName: true,
            speciality: true,
          },
        },
        hopital: {
          select: {
            userId: true,
            firstName: true,
            hospitalName: true,
            city: true,
          },
        },
      },
    });

    return {
      message: 'Candidature mise à jour avec succès',
      messageE: 'Application updated successfully',
      data: updated,
    };
  }

  async delete(id: number) {
    const candidature = await this.prisma.candidature.findUnique({
      where: { candidatureId: id },
    });

    if (!candidature) {
      throw new NotFoundException({
        message: `Candidature d'ID ${id} introuvable.`,
        messageE: `Application with ID ${id} not found.`,
      });
    }

    await this.prisma.candidature.delete({
      where: { candidatureId: id },
    });

    return {
      message: 'Candidature supprimée avec succès',
      messageE: 'Application deleted successfully',
    };
  }

  async cancelMany(dto: CancelCandidatureDto) {
    const candidatures = await this.prisma.candidature.findMany({
      where: {
        candidatureId: { in: dto.candidatureIds },
      },
      select: {
        candidatureId: true,
        status: true,
      },
    });

    if (candidatures.length === 0) {
      throw new NotFoundException({
        message: 'Aucune candidature trouvée.',
        messageE: 'No application found.',
      });
    }

    const cancellableIds = candidatures
      .filter((c) => c.status === CandidatureStatus.PENDING)
      .map((c) => c.candidatureId);

    const skippedIds = candidatures
      .filter((c) => c.status !== CandidatureStatus.PENDING)
      .map((c) => c.candidatureId);

    if (cancellableIds.length > 0) {
      await this.prisma.candidature.updateMany({
        where: {
          candidatureId: { in: cancellableIds },
        },
        data: {
          status: CandidatureStatus.CANCELLED,
        },
      });
    }

    return {
      message: `${cancellableIds.length} candidature(s) annulée(s) avec succès.`,
      messageE: `${cancellableIds.length} application(s) cancelled successfully.`,
      cancelledIds: cancellableIds,
      skippedIds,
    };
  }

  async accept(id: number) {
    const candidature = await this.prisma.candidature.findUnique({
      where: { candidatureId: id },
      include: {
        medecin: {
          select: {
            userId: true,
            firstName: true,
            lastName: true,
            expotoken: true,
          },
        },
        hopital: {
          select: {
            userId: true,
            firstName: true,
            hospitalName: true,
            city: true,
          },
        },
      },
    });

    if (!candidature) {
      throw new NotFoundException({
        message: `Candidature d'ID ${id} introuvable.`,
        messageE: `Application with ID ${id} not found.`,
      });
    }

    if (candidature.status !== CandidatureStatus.PENDING) {
      throw new BadRequestException({
        message:
          'Seules les candidatures en attente peuvent être acceptées.',
        messageE: 'Only pending applications can be accepted.',
      });
    }

    const result = await this.prisma.$transaction(async (tx) => {
      await tx.medecinHopital.upsert({
        where: {
          medecinId_hopitalId: {
            medecinId: candidature.medecinId,
            hopitalId: candidature.hopitalId,
          },
        },
        update: {},
        create: {
          medecinId: candidature.medecinId,
          hopitalId: candidature.hopitalId,
        },
      });

      return tx.candidature.update({
        where: { candidatureId: id },
        data: {
          status: CandidatureStatus.CONFIRMED,
        },
        include: {
          medecin: {
            select: {
              userId: true,
              firstName: true,
              lastName: true,
              speciality: true,
              expotoken: true,
            },
          },
          hopital: {
            select: {
              userId: true,
              firstName: true,
              hospitalName: true,
              city: true,
            },
          },
        },
      });
    });

    const hopitalLabel =
      result.hopital?.hospitalName || result.hopital?.firstName || 'cet hôpital';

    const titleFr = 'Candidature acceptée';
    const titleEn = 'Application accepted';
    const msgFr = `Votre candidature à "${hopitalLabel}" a été acceptée. Vous êtes maintenant affilié à cet hôpital.`;
    const msgEn = `Your application to "${hopitalLabel}" has been accepted. You are now affiliated with this hospital.`;

    void this.createNotification(
      result.medecin.userId,
      titleFr,
      titleEn,
      msgFr,
      msgEn,
    ).catch(() => void 0);

    void this.pushIfPossible(
      result.medecin.expotoken,
      titleFr,
      titleEn,
      msgFr,
      msgEn,
      {
        kind: 'CANDIDATURE_ACCEPTED',
        candidatureId: result.candidatureId,
        medecinId: result.medecinId,
        hopitalId: result.hopitalId,
      },
    ).catch(() => void 0);

    return {
      message:
        'Candidature acceptée avec succès, affiliation créée et médecin notifié.',
      messageE:
        'Application accepted successfully, affiliation created and doctor notified.',
      data: result,
    };
  }

  async reject(id: number) {
    const candidature = await this.prisma.candidature.findUnique({
      where: { candidatureId: id },
      include: {
        medecin: {
          select: {
            userId: true,
            firstName: true,
            lastName: true,
            expotoken: true,
          },
        },
        hopital: {
          select: {
            userId: true,
            firstName: true,
            hospitalName: true,
            city: true,
          },
        },
      },
    });

    if (!candidature) {
      throw new NotFoundException({
        message: `Candidature d'ID ${id} introuvable.`,
        messageE: `Application with ID ${id} not found.`,
      });
    }

    if (candidature.status !== CandidatureStatus.PENDING) {
      throw new BadRequestException({
        message:
          'Seules les candidatures en attente peuvent être refusées.',
        messageE: 'Only pending applications can be rejected.',
      });
    }

    const medecinId = candidature.medecin.userId;
    const medecinExpoToken = candidature.medecin.expotoken;
    const hopitalId = candidature.hopitalId;
    const hopitalLabel =
      candidature.hopital?.hospitalName ||
      candidature.hopital?.firstName ||
      'cet hôpital';

    await this.prisma.candidature.delete({
      where: { candidatureId: id },
    });

    const titleFr = 'Candidature rejetée';
    const titleEn = 'Application rejected';
    const msgFr = `Votre candidature à "${hopitalLabel}" a été rejetée.`;
    const msgEn = `Your application to "${hopitalLabel}" has been rejected.`;

    void this.createNotification(
      medecinId,
      titleFr,
      titleEn,
      msgFr,
      msgEn,
    ).catch(() => void 0);

    void this.pushIfPossible(
      medecinExpoToken,
      titleFr,
      titleEn,
      msgFr,
      msgEn,
      {
        kind: 'CANDIDATURE_REJECTED',
        candidatureId: id,
        medecinId,
        hopitalId,
      },
    ).catch(() => void 0);

    return {
      message: 'Candidature refusée, supprimée et médecin notifié avec succès',
      messageE: 'Application rejected, deleted and doctor notified successfully',
    };
  }
}
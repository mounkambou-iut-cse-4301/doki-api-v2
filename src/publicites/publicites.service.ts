import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  Prisma,
  StatutPublicite,
  TransactionStatus,
  TransactionType,
  TypeMediaPublicite,
  UserType,
  CibleAudiencePublicite,
} from 'generated/prisma';
import { randomUUID } from 'crypto';
import {
  uploadImageToCloudinary,
  uploadVideoToCloudinary,
} from 'src/utils/cloudinary';
import { CreatePackagePubliciteDto } from './dto/create-package-publicite.dto';
import { UpdatePackagePubliciteDto } from './dto/update-package-publicite.dto';
import { CreatePubliciteDto } from './dto/create-publicite.dto';
import { UpdatePubliciteDto } from './dto/update-publicite.dto';
import { PubliciteQueryDto } from './dto/publicite-query.dto';
import { PackagePubliciteQueryDto } from './dto/package-publicite-query.dto';
import { AdminPubliciteQueryDto } from './dto/admin-publicite-query.dto';

function ajouterJoursUTC(d: Date, n: number): Date {
  const result = new Date(d);
  result.setUTCDate(result.getUTCDate() + n);
  return result;
}

@Injectable()
export class PublicitesService {
  constructor(private readonly prisma: PrismaService) {}

  private verifierDureeVideoMax(valeur: number) {
    if (valeur > 30) {
      throw new BadRequestException({
        message: 'La durée maximale d’une vidéo ne peut pas dépasser 30 secondes.',
        messageE: 'Maximum video duration cannot exceed 30 seconds.',
      });
    }
  }

  private validerReglesMedias(
    medias: Array<{ typeMedia: TypeMediaPublicite; dureeSecondes?: number }>,
    pkg: {
      nombreMaxImages: number;
      nombreMaxVideos: number;
      dureeMaxVideoSecondes: number;
    },
  ) {
    const images = medias.filter(
      (m) => m.typeMedia === TypeMediaPublicite.IMAGE,
    );
    const videos = medias.filter(
      (m) => m.typeMedia === TypeMediaPublicite.VIDEO,
    );

    if (images.length > pkg.nombreMaxImages) {
      throw new BadRequestException({
        message: `Ce package autorise au maximum ${pkg.nombreMaxImages} image(s).`,
        messageE: `This package allows at most ${pkg.nombreMaxImages} image(s).`,
      });
    }

    if (videos.length > pkg.nombreMaxVideos) {
      throw new BadRequestException({
        message: `Ce package autorise au maximum ${pkg.nombreMaxVideos} vidéo(s).`,
        messageE: `This package allows at most ${pkg.nombreMaxVideos} video(s).`,
      });
    }

    const limiteVideo = Math.min(pkg.dureeMaxVideoSecondes, 30);

    for (let i = 0; i < videos.length; i++) {
      const video = videos[i];

      if (!video.dureeSecondes) {
        throw new BadRequestException({
          message: `La vidéo n°${i + 1} doit fournir le champ dureeSecondes.`,
          messageE: `Video #${i + 1} must provide dureeSecondes.`,
        });
      }

      if (video.dureeSecondes > limiteVideo) {
        throw new BadRequestException({
          message: `La vidéo n°${i + 1} dépasse la durée maximale autorisée de ${limiteVideo} seconde(s).`,
          messageE: `Video #${i + 1} exceeds the maximum allowed duration of ${limiteVideo} second(s).`,
        });
      }
    }

    if (images.length === 0 && videos.length === 0) {
      throw new BadRequestException({
        message: 'Au moins un média est requis.',
        messageE: 'At least one media item is required.',
      });
    }
  }

  private async televerserMedias(
    medias: Array<{
      typeMedia: TypeMediaPublicite;
      fichier: string;
      dureeSecondes?: number;
    }>,
    dossierBase: string,
  ) {
    return Promise.all(
      medias.map(async (media, index) => {
        try {
          let urlFichier: string;

          if (media.typeMedia === TypeMediaPublicite.IMAGE) {
            urlFichier = await uploadImageToCloudinary(
              media.fichier,
              `${dossierBase}/images`,
            );
          } else {
            urlFichier = await uploadVideoToCloudinary(
              media.fichier,
              `${dossierBase}/videos`,
            );
          }

          return {
            typeMedia: media.typeMedia,
            urlFichier,
            dureeSecondes:
              media.typeMedia === TypeMediaPublicite.VIDEO
                ? media.dureeSecondes ?? null
                : null,
            ordreAffichage: index,
          };
        } catch (error) {
          const numero = index + 1;

          if (media.typeMedia === TypeMediaPublicite.VIDEO) {
            throw new BadRequestException({
              message:
                `Le média n°${numero} est déclaré comme VIDEO, mais le fichier envoyé n'est pas valide. ` +
                `Une vidéo doit être une URL http(s) ou un base64 commençant par data:video/...;base64,. ` +
                `Détail: ${error.message}`,
              messageE:
                `Media #${numero} is declared as VIDEO, but the provided file is invalid. ` +
                `A video must be an http(s) URL or a base64 string starting with data:video/...;base64,. ` +
                `Details: ${error.message}`,
            });
          }

          throw new BadRequestException({
            message:
              `Le média n°${numero} est déclaré comme IMAGE, mais le fichier envoyé n'est pas valide. ` +
              `Une image doit être une URL http(s), un base64 image commençant par data:image/...;base64, ou un PDF commençant par data:application/pdf;base64,. ` +
              `Détail: ${error.message}`,
            messageE:
              `Media #${numero} is declared as IMAGE, but the provided file is invalid. ` +
              `An image must be an http(s) URL, an image base64 starting with data:image/...;base64,, or a PDF starting with data:application/pdf;base64,. ` +
              `Details: ${error.message}`,
          });
        }
      }),
    );
  }

  async createPackage(dto: CreatePackagePubliciteDto) {
    this.verifierDureeVideoMax(dto.dureeMaxVideoSecondes);

    if (dto.nombreMaxImages === 0 && dto.nombreMaxVideos === 0) {
      throw new BadRequestException({
        message: 'Un package doit autoriser au moins une image ou une vidéo.',
        messageE: 'A package must allow at least one image or one video.',
      });
    }

    const created = await this.prisma.packagePublicite.create({
      data: {
        nom: dto.nom,
        description: dto.description,
        dureeJours: dto.dureeJours,
        montant: dto.montant,
        cibleAudience: dto.cibleAudience,
        nombreMaxImages: dto.nombreMaxImages,
        nombreMaxVideos: dto.nombreMaxVideos,
        dureeMaxVideoSecondes: dto.dureeMaxVideoSecondes,
      },
    });

    return {
      message: 'Package publicité créé avec succès',
      messageE: 'Advertising package created successfully',
      data: created,
    };
  }

  async updatePackage(id: number, dto: UpdatePackagePubliciteDto) {
    const existant = await this.prisma.packagePublicite.findUnique({
      where: { packagePubliciteId: id },
    });

    if (!existant) {
      throw new NotFoundException({
        message: `Package publicité d'ID ${id} introuvable.`,
        messageE: `Advertising package with ID ${id} not found.`,
      });
    }

    if (
      dto.dureeMaxVideoSecondes !== undefined &&
      dto.dureeMaxVideoSecondes > 30
    ) {
      this.verifierDureeVideoMax(dto.dureeMaxVideoSecondes);
    }

    const updated = await this.prisma.packagePublicite.update({
      where: { packagePubliciteId: id },
      data: dto,
    });

    return {
      message: 'Package publicité mis à jour avec succès',
      messageE: 'Advertising package updated successfully',
      data: updated,
    };
  }

  async getAllPackages(query: PackagePubliciteQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.PackagePubliciteWhereInput = {};

    if (query.cibleAudience) {
      where.cibleAudience = query.cibleAudience;
    }

    if (query.actif !== undefined) {
      where.actif = query.actif;
    }

    if (query.montantMin !== undefined || query.montantMax !== undefined) {
      where.montant = {};
      if (query.montantMin !== undefined) {
        where.montant.gte = query.montantMin;
      }
      if (query.montantMax !== undefined) {
        where.montant.lte = query.montantMax;
      }
    }

    if (
      query.dureeJoursMin !== undefined ||
      query.dureeJoursMax !== undefined
    ) {
      where.dureeJours = {};
      if (query.dureeJoursMin !== undefined) {
        where.dureeJours.gte = query.dureeJoursMin;
      }
      if (query.dureeJoursMax !== undefined) {
        where.dureeJours.lte = query.dureeJoursMax;
      }
    }

    if (query.search?.trim()) {
      const s = query.search.trim();
      where.OR = [{ nom: { contains: s } }, { description: { contains: s } }];
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.packagePublicite.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.packagePublicite.count({ where }),
    ]);

    return {
      message: 'Liste des packages publicité récupérée avec succès',
      messageE: 'Advertising packages retrieved successfully',
      data: items,
      meta: {
        total,
        page,
        limit,
        pageCount: Math.ceil(total / limit),
      },
    };
  }

  async getOnePackage(id: number) {
    const item = await this.prisma.packagePublicite.findUnique({
      where: { packagePubliciteId: id },
    });

    if (!item) {
      throw new NotFoundException({
        message: `Package publicité d'ID ${id} introuvable.`,
        messageE: `Advertising package with ID ${id} not found.`,
      });
    }

    return {
      message: 'Package publicité récupéré avec succès',
      messageE: 'Advertising package retrieved successfully',
      data: item,
    };
  }

async createPublicite(dto: CreatePubliciteDto) {
  const televerseur = await this.prisma.user.findUnique({
    where: { userId: dto.televerseParId },
  });

  if (!televerseur) {
    throw new NotFoundException({
      message: `Utilisateur téléverseur d'ID ${dto.televerseParId} introuvable.`,
      messageE: `Uploader user with ID ${dto.televerseParId} not found.`,
    });
  }

  let annonceurUtilisateur: any = null;

  if (dto.annonceurUtilisateurId) {
    annonceurUtilisateur = await this.prisma.user.findUnique({
      where: { userId: dto.annonceurUtilisateurId },
    });

    if (!annonceurUtilisateur) {
      throw new NotFoundException({
        message: `Annonceur plateforme d'ID ${dto.annonceurUtilisateurId} introuvable.`,
        messageE: `Advertiser user with ID ${dto.annonceurUtilisateurId} not found.`,
      });
    }
  }

  if (!dto.annonceurUtilisateurId && !dto.nomAnnonceurExterne?.trim()) {
    throw new BadRequestException({
      message:
        "annonceurUtilisateurId ou nomAnnonceurExterne doit être fourni.",
      messageE:
        'annonceurUtilisateurId or nomAnnonceurExterne must be provided.',
    });
  }

  const pkg = await this.prisma.packagePublicite.findUnique({
    where: { packagePubliciteId: dto.packagePubliciteId },
  });

  if (!pkg) {
    throw new NotFoundException({
      message: `Package publicité d'ID ${dto.packagePubliciteId} introuvable.`,
      messageE: `Advertising package with ID ${dto.packagePubliciteId} not found.`,
    });
  }

  if (!pkg.actif) {
    throw new BadRequestException({
      message: 'Ce package publicité est inactif.',
      messageE: 'This advertising package is inactive.',
    });
  }

  for (let i = 0; i < dto.medias.length; i++) {
    const media = dto.medias[i];

    if (
      media.typeMedia === TypeMediaPublicite.VIDEO &&
      !media.dureeSecondes
    ) {
      throw new BadRequestException({
        message: `Le média n°${i + 1} est une vidéo. Le champ dureeSecondes est obligatoire.`,
        messageE: `Media #${i + 1} is a video. The field dureeSecondes is required.`,
      });
    }

    if (
      media.typeMedia === TypeMediaPublicite.VIDEO &&
      media.dureeSecondes &&
      media.dureeSecondes > 30
    ) {
      throw new BadRequestException({
        message: `Le média n°${i + 1} dépasse 30 secondes. Une vidéo publicitaire ne doit pas dépasser 30 secondes.`,
        messageE: `Media #${i + 1} exceeds 30 seconds. An advertising video must not exceed 30 seconds.`,
      });
    }
  }

  this.validerReglesMedias(dto.medias, pkg);

  const maintenant = new Date();
  const dateDebut = new Date(dto.dateDebut);

  if (isNaN(dateDebut.getTime())) {
    throw new BadRequestException({
      message: 'dateDebut invalide.',
      messageE: 'Invalid dateDebut.',
    });
  }

  if (dateDebut.getTime() < maintenant.getTime()) {
    throw new BadRequestException({
      message: 'dateDebut doit être maintenant ou dans le futur.',
      messageE: 'dateDebut must be now or in the future.',
    });
  }

  const dateFin = ajouterJoursUTC(dateDebut, pkg.dureeJours);

  const dossierBase = `publicites/${dto.titre.replace(/\s+/g, '_')}_${Date.now()}`;
  const mediasTeleverses = await this.televerserMedias(dto.medias, dossierBase);

  const televerseurEstAdmin =
    televerseur.userType === UserType.ADMIN ||
    televerseur.userType === UserType.SUPERADMIN;

  const data: Prisma.PubliciteCreateInput = {
    titre: dto.titre,
    description: dto.description,
    nomAnnonceurExterne: dto.nomAnnonceurExterne ?? null,
    telephoneAnnonceurExterne: dto.telephoneAnnonceurExterne ?? null,
    emailAnnonceurExterne: dto.emailAnnonceurExterne ?? null,
    cibleAudience: pkg.cibleAudience,
    statut: televerseurEstAdmin
      ? StatutPublicite.ACTIVE
      : StatutPublicite.EN_ATTENTE_PAIEMENT,
    dateDebut,
    dateFin,
    montant: pkg.montant,
    packagePublicite: {
      connect: { packagePubliciteId: pkg.packagePubliciteId },
    },
    televersePar: {
      connect: { userId: dto.televerseParId },
    },
    transaction: {
      create: {
        amount: pkg.montant,
        type: TransactionType.PUBLICITE,
        status: televerseurEstAdmin
          ? TransactionStatus.PAID
          : TransactionStatus.PENDING,
        paymentId: televerseurEstAdmin
          ? `TR-PUB-ADMIN-${randomUUID()}`
          : null,
      },
    },
    medias: {
      create: mediasTeleverses,
    },
  };

  if (dto.annonceurUtilisateurId) {
    data.annonceurUtilisateur = {
      connect: { userId: dto.annonceurUtilisateurId },
    };
  }

  const created = await this.prisma.publicite.create({
    data,
    include: {
      packagePublicite: true,
      annonceurUtilisateur: true,
      televersePar: true,
      medias: true,
      transaction: true,
    },
  });

  if (!televerseurEstAdmin && created.transactionId) {
    setTimeout(async () => {
      try {
        await this.prisma.$transaction([
          this.prisma.transaction.update({
            where: { transactionId: created.transactionId! },
            data: {
              status: TransactionStatus.PAID,
              paymentId: `TR-PUB-${randomUUID()}`,
            },
          }),
          this.prisma.publicite.update({
            where: { publiciteId: created.publiciteId },
            data: {
              statut: StatutPublicite.ACTIVE,
            },
          }),
        ]);
      } catch (error) {
        console.error('Erreur confirmation différée publicité :', error);
      }
    }, 10_000);
  }

  return {
    message: televerseurEstAdmin
      ? 'Publicité créée avec succès et payée immédiatement.'
      : 'Publicité créée avec succès. Paiement simulé en cours, confirmation dans 10 secondes.',
    messageE: televerseurEstAdmin
      ? 'Advertisement created successfully and paid immediately.'
      : 'Advertisement created successfully. Simulated payment in progress, confirmation in 10 seconds.',
    data: created,
  };
}

async findAllAdmin(query: AdminPubliciteQueryDto) {
  const page = query.page || 1;
  const limit = query.limit || 20;
  const skip = (page - 1) * limit;

  const where: Prisma.PubliciteWhereInput = {};

  if (query.statut) {
    where.statut = query.statut;
  }

  if (query.cibleAudience) {
    where.cibleAudience = query.cibleAudience;
  }

  if (query.packagePubliciteId) {
    where.packagePubliciteId = query.packagePubliciteId;
  }

  if (query.televerseParId) {
    where.televerseParId = query.televerseParId;
  }

  if (query.annonceurUtilisateurId) {
    where.annonceurUtilisateurId = query.annonceurUtilisateurId;
  }

  if (query.dateDebutMin || query.dateDebutMax) {
    where.dateDebut = {};
    if (query.dateDebutMin) {
      where.dateDebut.gte = new Date(query.dateDebutMin);
    }
    if (query.dateDebutMax) {
      where.dateDebut.lte = new Date(query.dateDebutMax);
    }
  }

  if (query.dateFinMin || query.dateFinMax) {
    where.dateFin = {};
    if (query.dateFinMin) {
      where.dateFin.gte = new Date(query.dateFinMin);
    }
    if (query.dateFinMax) {
      where.dateFin.lte = new Date(query.dateFinMax);
    }
  }

  if (query.search?.trim()) {
    const s = query.search.trim();
    where.OR = [
      { titre: { contains: s } },
      { description: { contains: s } },
      { nomAnnonceurExterne: { contains: s } },
      {
        annonceurUtilisateur: {
          is: {
            firstName: { contains: s },
          },
        },
      },
      {
        annonceurUtilisateur: {
          is: {
            lastName: { contains: s },
          },
        },
      },
      {
        televersePar: {
          is: {
            firstName: { contains: s },
          },
        },
      },
      {
        televersePar: {
          is: {
            lastName: { contains: s },
          },
        },
      },
    ];
  }

  const [items, total] = await this.prisma.$transaction([
    this.prisma.publicite.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        packagePublicite: true,
        annonceurUtilisateur: true,
        televersePar: true,
        medias: true,
        transaction: true,
      },
    }),
    this.prisma.publicite.count({ where }),
  ]);

  return {
    message: 'Liste complète des publicités récupérée avec succès',
    messageE: 'Full advertisements list retrieved successfully',
    data: items,
    meta: {
      total,
      page,
      limit,
      pageCount: Math.ceil(total / limit),
    },
  };
}
 async findAll(query: PubliciteQueryDto) {
  const page = query.page || 1;
  const limit = query.limit || 20;
  const skip = (page - 1) * limit;
  const maintenant = new Date();

  const where: Prisma.PubliciteWhereInput = {
    statut: StatutPublicite.ACTIVE,
    dateDebut: { lte: maintenant },
    dateFin: { gte: maintenant },
    transaction: {
      is: {
        status: TransactionStatus.PAID,
      },
    },
  };

  if (query.cibleAudience) {
    if (query.cibleAudience === CibleAudiencePublicite.MEDECIN) {
      where.OR = [
        { cibleAudience: CibleAudiencePublicite.MEDECIN },
        { cibleAudience: CibleAudiencePublicite.LES_DEUX },
      ];
    } else if (query.cibleAudience === CibleAudiencePublicite.PATIENT) {
      where.OR = [
        { cibleAudience: CibleAudiencePublicite.PATIENT },
        { cibleAudience: CibleAudiencePublicite.LES_DEUX },
      ];
    } else {
      where.cibleAudience = CibleAudiencePublicite.LES_DEUX;
    }
  }

  if (query.search?.trim()) {
    const s = query.search.trim();
    const andConditions = where.AND
      ? [...(Array.isArray(where.AND) ? where.AND : [where.AND])]
      : [];

    andConditions.push({
      OR: [
        { titre: { contains: s } },
        { description: { contains: s } },
        { nomAnnonceurExterne: { contains: s } },
      ],
    });

    where.AND = andConditions;
  }

  const [items, total] = await this.prisma.$transaction([
    this.prisma.publicite.findMany({
      where,
      skip,
      take: limit,
      orderBy: { dateDebut: 'asc' },
      include: {
        packagePublicite: true,
        annonceurUtilisateur: true,
        televersePar: true,
        medias: true,
        transaction: true,
      },
    }),
    this.prisma.publicite.count({ where }),
  ]);

  return {
    message: 'Liste des publicités visibles récupérée avec succès',
    messageE: 'Visible advertisements retrieved successfully',
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
    const item = await this.prisma.publicite.findUnique({
      where: { publiciteId: id },
      include: {
        packagePublicite: true,
        annonceurUtilisateur: true,
        televersePar: true,
        medias: true,
        transaction: true,
      },
    });

    if (!item) {
      throw new NotFoundException({
        message: `Publicité d'ID ${id} introuvable.`,
        messageE: `Advertisement with ID ${id} not found.`,
      });
    }

    return {
      message: 'Publicité récupérée avec succès',
      messageE: 'Advertisement retrieved successfully',
      data: item,
    };
  }

  async update(id: number, dto: UpdatePubliciteDto) {
    const existante = await this.prisma.publicite.findUnique({
      where: { publiciteId: id },
      include: {
        packagePublicite: true,
      },
    });

    if (!existante) {
      throw new NotFoundException({
        message: `Publicité d'ID ${id} introuvable.`,
        messageE: `Advertisement with ID ${id} not found.`,
      });
    }

    if (
      existante.statut === StatutPublicite.ANNULEE ||
      existante.statut === StatutPublicite.TERMINEE
    ) {
      throw new BadRequestException({
        message: 'Cette publicité ne peut plus être modifiée.',
        messageE: 'This advertisement can no longer be updated.',
      });
    }

    if (new Date() >= existante.dateDebut) {
      throw new BadRequestException({
        message: 'Une publicité déjà démarrée ne peut plus être modifiée.',
        messageE:
          'An advertisement that has already started can no longer be updated.',
      });
    }

    let annonceurConnect: Prisma.UserWhereUniqueInput | undefined = undefined;

    if (dto.annonceurUtilisateurId) {
      const annonceur = await this.prisma.user.findUnique({
        where: { userId: dto.annonceurUtilisateurId },
      });

      if (!annonceur) {
        throw new NotFoundException({
          message: `Annonceur plateforme d'ID ${dto.annonceurUtilisateurId} introuvable.`,
          messageE: `Advertiser user with ID ${dto.annonceurUtilisateurId} not found.`,
        });
      }

      annonceurConnect = { userId: dto.annonceurUtilisateurId };
    }

    const dataToUpdate: Prisma.PubliciteUpdateInput = {
      titre: dto.titre ?? existante.titre,
      description: dto.description ?? existante.description,
      nomAnnonceurExterne:
        dto.nomAnnonceurExterne !== undefined
          ? dto.nomAnnonceurExterne
          : existante.nomAnnonceurExterne,
      telephoneAnnonceurExterne:
        dto.telephoneAnnonceurExterne !== undefined
          ? dto.telephoneAnnonceurExterne
          : existante.telephoneAnnonceurExterne,
      emailAnnonceurExterne:
        dto.emailAnnonceurExterne !== undefined
          ? dto.emailAnnonceurExterne
          : existante.emailAnnonceurExterne,
    };

    if (annonceurConnect) {
      dataToUpdate.annonceurUtilisateur = {
        connect: annonceurConnect,
      };
    } else if (
      dto.nomAnnonceurExterne !== undefined ||
      dto.telephoneAnnonceurExterne !== undefined ||
      dto.emailAnnonceurExterne !== undefined
    ) {
      dataToUpdate.annonceurUtilisateur = {
        disconnect: true,
      };
    }

    if (dto.dateDebut) {
      const newStart = new Date(dto.dateDebut);

      if (isNaN(newStart.getTime())) {
        throw new BadRequestException({
          message: 'dateDebut invalide.',
          messageE: 'Invalid dateDebut.',
        });
      }

      if (newStart.getTime() < Date.now()) {
        throw new BadRequestException({
          message: 'dateDebut doit être maintenant ou dans le futur.',
          messageE: 'dateDebut must be now or in the future.',
        });
      }

      dataToUpdate.dateDebut = newStart;
      dataToUpdate.dateFin = ajouterJoursUTC(
        newStart,
        existante.packagePublicite.dureeJours,
      );
    }

    const dossierBase = `publicites/${(dto.titre || existante.titre).replace(/\s+/g, '_')}_${Date.now()}`;

    if (dto.medias?.length) {
      for (let i = 0; i < dto.medias.length; i++) {
        const media = dto.medias[i];

        if (
          media.typeMedia === TypeMediaPublicite.VIDEO &&
          !media.dureeSecondes
        ) {
          throw new BadRequestException({
            message: `Le média n°${i + 1} est une vidéo. Le champ dureeSecondes est obligatoire.`,
            messageE: `Media #${i + 1} is a video. The field dureeSecondes is required.`,
          });
        }

        if (
          media.typeMedia === TypeMediaPublicite.VIDEO &&
          media.dureeSecondes &&
          media.dureeSecondes > 30
        ) {
          throw new BadRequestException({
            message: `Le média n°${i + 1} dépasse 30 secondes. Une vidéo publicitaire ne doit pas dépasser 30 secondes.`,
            messageE: `Media #${i + 1} exceeds 30 seconds. An advertising video must not exceed 30 seconds.`,
          });
        }
      }

      this.validerReglesMedias(dto.medias, existante.packagePublicite);

      const mediasTeleverses = await this.televerserMedias(
        dto.medias,
        dossierBase,
      );

      await this.prisma.$transaction(async (tx) => {
        await tx.publicite.update({
          where: { publiciteId: id },
          data: dataToUpdate,
        });

        await tx.mediaPublicite.deleteMany({
          where: { publiciteId: id },
        });

        await tx.mediaPublicite.createMany({
          data: mediasTeleverses.map((m) => ({
            publiciteId: id,
            typeMedia: m.typeMedia,
            urlFichier: m.urlFichier,
            dureeSecondes: m.dureeSecondes,
            ordreAffichage: m.ordreAffichage,
          })),
        });
      });
    } else {
      await this.prisma.publicite.update({
        where: { publiciteId: id },
        data: dataToUpdate,
      });
    }

    return this.findOne(id);
  }

  async cancel(id: number) {
    const existante = await this.prisma.publicite.findUnique({
      where: { publiciteId: id },
    });

    if (!existante) {
      throw new NotFoundException({
        message: `Publicité d'ID ${id} introuvable.`,
        messageE: `Advertisement with ID ${id} not found.`,
      });
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.publicite.update({
        where: { publiciteId: id },
        data: { statut: StatutPublicite.ANNULEE },
      });

      if (existante.transactionId) {
        const transaction = await tx.transaction.findUnique({
          where: { transactionId: existante.transactionId },
        });

        if (transaction && transaction.status !== TransactionStatus.PAID) {
          await tx.transaction.update({
            where: { transactionId: existante.transactionId },
            data: { status: TransactionStatus.CANCELLED },
          });
        }
      }
    });

    return {
      message: 'Publicité annulée avec succès',
      messageE: 'Advertisement cancelled successfully',
    };
  }

  async terminate(id: number) {
    const existante = await this.prisma.publicite.findUnique({
      where: { publiciteId: id },
    });

    if (!existante) {
      throw new NotFoundException({
        message: `Publicité d'ID ${id} introuvable.`,
        messageE: `Advertisement with ID ${id} not found.`,
      });
    }

    const updated = await this.prisma.publicite.update({
      where: { publiciteId: id },
      data: { statut: StatutPublicite.TERMINEE },
      include: {
        packagePublicite: true,
        annonceurUtilisateur: true,
        televersePar: true,
        medias: true,
        transaction: true,
      },
    });

    return {
      message: 'Publicité terminée avec succès',
      messageE: 'Advertisement terminated successfully',
      data: updated,
    };
  }
}
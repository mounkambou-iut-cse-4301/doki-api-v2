import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePackageDto } from './dto/create-package.dto';
import { UpdatePackageDto } from './dto/update-package.dto';
import { PackageQueryDto } from './dto/package-query.dto';

@Injectable()
export class PackageService {
  constructor(private readonly prisma: PrismaService) {}

  // CREATE
  async create(dto: CreatePackageDto) {
    // Vérifier que la spécialité existe
    const speciality = await this.prisma.speciality.findUnique({
      where: { specialityId: dto.specialityId },
    });
    if (!speciality) {
      throw new NotFoundException({
        message: `Spécialité d'ID ${dto.specialityId} introuvable.`,
        messageE: `Speciality with ID ${dto.specialityId} not found.`,
      });
    }

    // Vérifier si un package avec le même nom existe déjà pour cette spécialité
    const existing = await this.prisma.groupePackage.findFirst({
      where: {
        nom: dto.nom,
        specialityId: dto.specialityId,
      },
    });
    if (existing) {
      throw new ConflictException({
        message: `Un package avec le nom "${dto.nom}" existe déjà pour cette spécialité.`,
        messageE: `A package with name "${dto.nom}" already exists for this speciality.`,
      });
    }

    const packageData = await this.prisma.groupePackage.create({
      data: {
        nom: dto.nom,
        specialityId: dto.specialityId,
        nombreConsultations: dto.nombreConsultations,
        chatInclus: dto.chatInclus,
        appelInclus: dto.appelInclus,
        prix: dto.prix,
        dureeValiditeJours: dto.dureeValiditeJours,
        isActive: true,
      },
      include: {
        speciality: {
          select: {
            specialityId: true,
            name: true,
            consultationPrice: true,
          },
        },
      },
    });

    return {
      message: 'Package créé avec succès',
      messageE: 'Package created successfully',
      data: packageData,
    };
  }

  // GET ALL
  async findAll(query: PackageQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.search) {
      where.nom = { contains: query.search };
    }

    if (query.specialityId) {
      where.specialityId = query.specialityId;
    }

    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.groupePackage.findMany({
        where,
        skip,
        take: limit,
        include: {
          speciality: {
            select: {
              specialityId: true,
              name: true,
              consultationPrice: true,
            },
          },
          abonnements: {
            select: {
              abonnementId: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.groupePackage.count({ where }),
    ]);

    return {
      message: 'Liste des packages récupérée avec succès',
      messageE: 'Packages list retrieved successfully',
      data: items,
      meta: {
        total,
        page,
        limit,
        pageCount: Math.ceil(total / limit),
      },
    };
  }

  // GET ONE
  async findOne(id: number) {
    const packageData = await this.prisma.groupePackage.findUnique({
      where: { packageId: id },
      include: {
        speciality: true,
        abonnements: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            abonnementId: true,
            patientId: true,
            debutDate: true,
            endDate: true,
            status: true,
            patient: {
              select: {
                userId: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!packageData) {
      throw new NotFoundException({
        message: `Package d'ID ${id} introuvable.`,
        messageE: `Package with ID ${id} not found.`,
      });
    }

    const nombreAbonnements = await this.prisma.abonnement.count({
      where: { packageId: id },
    });

    return {
      message: 'Package récupéré avec succès',
      messageE: 'Package retrieved successfully',
      data: {
        ...packageData,
        nombreAbonnements,
      },
    };
  }

  // UPDATE
  async update(id: number, dto: UpdatePackageDto) {
    const existing = await this.prisma.groupePackage.findUnique({
      where: { packageId: id },
    });

    if (!existing) {
      throw new NotFoundException({
        message: `Package d'ID ${id} introuvable.`,
        messageE: `Package with ID ${id} not found.`,
      });
    }

    // Si changement de spécialité, vérifier qu'elle existe
    if (dto.specialityId && dto.specialityId !== existing.specialityId) {
      const speciality = await this.prisma.speciality.findUnique({
        where: { specialityId: dto.specialityId },
      });
      if (!speciality) {
        throw new NotFoundException({
          message: `Spécialité d'ID ${dto.specialityId} introuvable.`,
          messageE: `Speciality with ID ${dto.specialityId} not found.`,
        });
      }
    }

    // Si changement de nom, vérifier l'unicité
    if (dto.nom && dto.nom !== existing.nom) {
      const duplicate = await this.prisma.groupePackage.findFirst({
        where: {
          nom: dto.nom,
          specialityId: dto.specialityId || existing.specialityId,
          packageId: { not: id },
        },
      });
      if (duplicate) {
        throw new ConflictException({
          message: `Un package avec le nom "${dto.nom}" existe déjà pour cette spécialité.`,
          messageE: `A package with name "${dto.nom}" already exists for this speciality.`,
        });
      }
    }

    const updated = await this.prisma.groupePackage.update({
      where: { packageId: id },
      data: {
        nom: dto.nom,
        specialityId: dto.specialityId,
        nombreConsultations: dto.nombreConsultations,
        chatInclus: dto.chatInclus,
        appelInclus: dto.appelInclus,
        prix: dto.prix,
        dureeValiditeJours: dto.dureeValiditeJours,
        isActive: dto.isActive,
      },
      include: {
        speciality: {
          select: {
            specialityId: true,
            name: true,
          },
        },
      },
    });

    return {
      message: 'Package mis à jour avec succès',
      messageE: 'Package updated successfully',
      data: updated,
    };
  }

  // DELETE
  async remove(id: number) {
    const existing = await this.prisma.groupePackage.findUnique({
      where: { packageId: id },
      include: {
        abonnements: {
          take: 1,
        },
      },
    });

    if (!existing) {
      throw new NotFoundException({
        message: `Package d'ID ${id} introuvable.`,
        messageE: `Package with ID ${id} not found.`,
      });
    }

    // Vérifier si des abonnements existent
    if (existing.abonnements.length > 0) {
      throw new BadRequestException({
        message: 'Impossible de supprimer ce package car des abonnements sont associés.',
        messageE: 'Cannot delete this package because subscriptions are associated.',
      });
    }

    await this.prisma.groupePackage.delete({
      where: { packageId: id },
    });

    return {
      message: 'Package supprimé avec succès',
      messageE: 'Package deleted successfully',
    };
  }

  // ACTIVATE
  async activate(id: number) {
    const existing = await this.prisma.groupePackage.findUnique({
      where: { packageId: id },
    });

    if (!existing) {
      throw new NotFoundException({
        message: `Package d'ID ${id} introuvable.`,
        messageE: `Package with ID ${id} not found.`,
      });
    }

    if (existing.isActive) {
      return {
        message: 'Package déjà actif',
        messageE: 'Package is already active',
        data: existing,
      };
    }

    const updated = await this.prisma.groupePackage.update({
      where: { packageId: id },
      data: { isActive: true },
      include: {
        speciality: {
          select: {
            specialityId: true,
            name: true,
          },
        },
      },
    });

    return {
      message: 'Package activé avec succès',
      messageE: 'Package activated successfully',
      data: updated,
    };
  }

  // DEACTIVATE
  async deactivate(id: number) {
    const existing = await this.prisma.groupePackage.findUnique({
      where: { packageId: id },
    });

    if (!existing) {
      throw new NotFoundException({
        message: `Package d'ID ${id} introuvable.`,
        messageE: `Package with ID ${id} not found.`,
      });
    }

    if (!existing.isActive) {
      return {
        message: 'Package déjà inactif',
        messageE: 'Package is already inactive',
        data: existing,
      };
    }

    const updated = await this.prisma.groupePackage.update({
      where: { packageId: id },
      data: { isActive: false },
      include: {
        speciality: {
          select: {
            specialityId: true,
            name: true,
          },
        },
      },
    });

    return {
      message: 'Package désactivé avec succès',
      messageE: 'Package deactivated successfully',
      data: updated,
    };
  }

  // GET BY SPECIALITY
  async getBySpeciality(specialityId: number, onlyActive: boolean = true) {
    const speciality = await this.prisma.speciality.findUnique({
      where: { specialityId },
    });

    if (!speciality) {
      throw new NotFoundException({
        message: `Spécialité d'ID ${specialityId} introuvable.`,
        messageE: `Speciality with ID ${specialityId} not found.`,
      });
    }

    const where: any = { specialityId };
    if (onlyActive) {
      where.isActive = true;
    }

    const packages = await this.prisma.groupePackage.findMany({
      where,
      include: {
        speciality: {
          select: {
            specialityId: true,
            name: true,
          },
        },
      },
      orderBy: { prix: 'asc' },
    });

    return {
      message: 'Liste des packages récupérée avec succès',
      messageE: 'Packages list retrieved successfully',
      data: packages,
    };
  }
}
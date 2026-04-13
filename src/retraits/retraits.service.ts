import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  StatutParametreRetrait,
  StatutRetrait,
  UserType,
} from 'generated/prisma';
import { createHash, timingSafeEqual } from 'crypto';
import { EmailService } from '../utils/email.service';
import {
  decryptBalance,
  subtractFromEncryptedBalance,
} from 'src/utils/secure-balance';
import { CreateParametreRetraitDto } from './dto/create-parametre-retrait.dto';
import { UpdateParametreRetraitDto } from './dto/update-parametre-retrait.dto';
import { VerifyParametreRetraitOtpDto } from './dto/verify-parametre-retrait-otp.dto';
import { DemanderRetraitDto } from './dto/demander-retrait.dto';
import { VerifyRetraitOtpDto } from './dto/verify-retrait-otp.dto';
import { QueryRetraitDto } from './dto/query-retrait.dto';
import { CompleteRetraitDto } from './dto/complete-retrait.dto';
import { CancelRetraitDto } from './dto/cancel-retrait.dto';

@Injectable()
export class RetraitsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  private generateOtpCode(): string {
    let otp = '';
    for (let i = 0; i < 6; i++) {
      otp += Math.floor(Math.random() * 10).toString();
    }
    return otp;
  }

  private async hashOtp(otp: string): Promise<string> {
    return createHash('sha256').update(otp).digest('hex');
  }

  private async compareOtp(
    plainOtp: string,
    hashedOtp: string,
  ): Promise<boolean> {
    const plainHashed = createHash('sha256').update(plainOtp).digest('hex');

    const a = Buffer.from(plainHashed, 'utf8');
    const b = Buffer.from(hashedOtp, 'utf8');

    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  }

  private buildOtpExpiresAt(minutes = 10): Date {
    const date = new Date();
    date.setMinutes(date.getMinutes() + minutes);
    return date;
  }

  private async sendOtpByEmail(
    toEmail: string,
    subject: string,
    otp: string,
    actionLabel: string,
  ): Promise<void> {
    const message =
      `Bonjour,\n\n` +
      `Votre code OTP pour ${actionLabel} est : ${otp}\n\n` +
      `Ce code expire dans 10 minutes.\n\n` +
      `Merci.`;

    await this.emailService.sendEmail(subject, message, toEmail);
  }

  private async assertOwner(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { userId },
      select: {
        userId: true,
        userType: true,
        firstName: true,
        lastName: true,
        email: true,
      },
    });

    if (!user) {
      throw new NotFoundException({
        message: `Utilisateur d'ID ${userId} introuvable.`,
        messageE: `User with ID ${userId} not found.`,
      });
    }

    const isAllowedOwner =
      user.userType === UserType.MEDECIN ||
      user.userType === UserType.HOPITAL;

    if (!isAllowedOwner) {
      throw new ForbiddenException({
        message:
          'Seuls les médecins et les hôpitaux peuvent utiliser le module de retrait.',
        messageE:
          'Only doctors and hospitals can use the withdrawal module.',
      });
    }

    return user;
  }

  private async assertAdmin(adminId: number) {
    const admin = await this.prisma.user.findUnique({
      where: { userId: adminId },
      select: {
        userId: true,
        userType: true,
        firstName: true,
        lastName: true,
      },
    });

    if (!admin) {
      throw new NotFoundException({
        message: `Admin d'ID ${adminId} introuvable.`,
        messageE: `Admin with ID ${adminId} not found.`,
      });
    }

    const isAdmin =
      admin.userType === UserType.ADMIN ||
      admin.userType === UserType.SUPERADMIN;

    if (!isAdmin) {
      throw new ForbiddenException({
        message: 'Cette action est réservée à l’admin.',
        messageE: 'This action is restricted to admin.',
      });
    }

    return admin;
  }

  private async getDecryptedOwnerBalance(userId: number): Promise<number> {
    const row = await this.prisma.soldeMedecin.findFirst({
      where: { medecinId: userId },
    });

    if (!row) return 0;
    return decryptBalance(row.solde);
  }

  private async getPendingTotal(
    userId: number,
    excludeRetraitId?: number,
  ): Promise<number> {
    const result = await this.prisma.retrait.aggregate({
      where: {
        userId,
        statut: StatutRetrait.PENDING,
        retraitId: excludeRetraitId ? { not: excludeRetraitId } : undefined,
      },
      _sum: { montant: true },
    });

    return Number(result._sum.montant || 0);
  }

  async createParametre(dto: CreateParametreRetraitDto) {
    const owner = await this.assertOwner(dto.userId);

    const existing = await this.prisma.parametreRetrait.findUnique({
      where: { userId: dto.userId },
    });

    if (existing) {
      throw new BadRequestException({
        message:
          'Cet utilisateur possède déjà un paramètre de retrait. Utilisez update.',
        messageE:
          'This user already has a withdrawal parameter. Use update.',
      });
    }

    const numeroConflict = await this.prisma.parametreRetrait.findFirst({
      where: { numeroRetrait: dto.numeroRetrait },
    });

    if (numeroConflict) {
      throw new BadRequestException({
        message: 'Ce numéro de retrait est déjà utilisé.',
        messageE: 'This withdrawal number is already used.',
      });
    }

    const otp = this.generateOtpCode();
    const otpHash = await this.hashOtp(otp);
    const otpExpiresAt = this.buildOtpExpiresAt(10);

    const parametre = await this.prisma.parametreRetrait.create({
      data: {
        userId: dto.userId,
        numeroRetrait: dto.numeroRetrait,
        statut: StatutParametreRetrait.OTP_EN_ATTENTE,
        otpHash,
        otpExpiresAt,
      },
    });

    await this.sendOtpByEmail(
      owner.email,
      'Validation du numéro de retrait',
      otp,
      'la validation de votre numéro de retrait',
    );

    return {
      message: 'OTP envoyé pour confirmer le numéro de retrait',
      messageE: 'OTP sent to confirm withdrawal number',
      data: {
        parametreRetraitId: parametre.parametreRetraitId,
        userId: parametre.userId,
        numeroRetrait: parametre.numeroRetrait,
        statut: parametre.statut,
        otpExpiresAt: parametre.otpExpiresAt,
      },
    };
  }

  async getParametreByUserId(userId: number) {
    await this.assertOwner(userId);

    const parametre = await this.prisma.parametreRetrait.findUnique({
      where: { userId },
      select: {
        parametreRetraitId: true,
        userId: true,
        numeroRetrait: true,
        statut: true,
        verifieAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!parametre) {
      throw new NotFoundException({
        message: 'Paramètre de retrait introuvable.',
        messageE: 'Withdrawal parameter not found.',
      });
    }

    return {
      message: 'Paramètre de retrait récupéré avec succès',
      messageE: 'Withdrawal parameter retrieved successfully',
      data: parametre,
    };
  }

  async updateParametre(parametreId: number, dto: UpdateParametreRetraitDto) {
    const parametre = await this.prisma.parametreRetrait.findUnique({
      where: { parametreRetraitId: parametreId },
      include: {
        user: {
          select: {
            userId: true,
            firstName: true,
            lastName: true,
            email: true,
            userType: true,
          },
        },
      },
    });

    if (!parametre) {
      throw new NotFoundException({
        message: 'Paramètre de retrait introuvable.',
        messageE: 'Withdrawal parameter not found.',
      });
    }

    const numeroConflict = await this.prisma.parametreRetrait.findFirst({
      where: {
        numeroRetrait: dto.numeroRetrait,
        parametreRetraitId: { not: parametreId },
      },
    });

    if (numeroConflict) {
      throw new BadRequestException({
        message: 'Ce numéro de retrait est déjà utilisé.',
        messageE: 'This withdrawal number is already used.',
      });
    }

    const otp = this.generateOtpCode();
    const otpHash = await this.hashOtp(otp);
    const otpExpiresAt = this.buildOtpExpiresAt(10);

    const updated = await this.prisma.parametreRetrait.update({
      where: { parametreRetraitId: parametreId },
      data: {
        numeroRetrait: dto.numeroRetrait,
        statut: StatutParametreRetrait.OTP_EN_ATTENTE,
        otpHash,
        otpExpiresAt,
        otpValidatedAt: null,
        verifieAt: null,
      },
    });

    await this.sendOtpByEmail(
      parametre.user.email,
      'Revalidation du numéro de retrait',
      otp,
      'la revalidation de votre numéro de retrait',
    );

    return {
      message: 'OTP envoyé pour revalider le numéro de retrait',
      messageE: 'OTP sent to revalidate withdrawal number',
      data: {
        parametreRetraitId: updated.parametreRetraitId,
        userId: updated.userId,
        numeroRetrait: updated.numeroRetrait,
        statut: updated.statut,
        otpExpiresAt: updated.otpExpiresAt,
      },
    };
  }

  async verifyParametreOtp(
    parametreId: number,
    dto: VerifyParametreRetraitOtpDto,
  ) {
    const parametre = await this.prisma.parametreRetrait.findUnique({
      where: { parametreRetraitId: parametreId },
    });

    if (!parametre) {
      throw new NotFoundException({
        message: 'Paramètre de retrait introuvable.',
        messageE: 'Withdrawal parameter not found.',
      });
    }

    if (!parametre.otpHash || !parametre.otpExpiresAt) {
      throw new BadRequestException({
        message: 'Aucun OTP en attente pour ce paramètre.',
        messageE: 'No pending OTP for this parameter.',
      });
    }

    if (new Date() > parametre.otpExpiresAt) {
      throw new BadRequestException({
        message: 'OTP expiré.',
        messageE: 'OTP expired.',
      });
    }

    const isValid = await this.compareOtp(dto.otp, parametre.otpHash);
    if (!isValid) {
      throw new BadRequestException({
        message: 'OTP invalide.',
        messageE: 'Invalid OTP.',
      });
    }

    const updated = await this.prisma.parametreRetrait.update({
      where: { parametreRetraitId: parametreId },
      data: {
        statut: StatutParametreRetrait.VERIFIE,
        otpValidatedAt: new Date(),
        verifieAt: new Date(),
        otpHash: null,
        otpExpiresAt: null,
      },
    });

    return {
      message: 'Numéro de retrait vérifié avec succès',
      messageE: 'Withdrawal number verified successfully',
      data: {
        parametreRetraitId: updated.parametreRetraitId,
        userId: updated.userId,
        numeroRetrait: updated.numeroRetrait,
        statut: updated.statut,
        verifieAt: updated.verifieAt,
      },
    };
  }

  async getSoldeUser(userId: number) {
    await this.assertOwner(userId);

    const row = await this.prisma.soldeMedecin.findFirst({
      where: { medecinId: userId },
    });

    return {
      message: 'Solde récupéré avec succès',
      messageE: 'Balance retrieved successfully',
      data: {
        userId,
        solde: row ? decryptBalance(row.solde) : 0,
      },
    };
  }

 async demanderRetrait(dto: DemanderRetraitDto) {
  const owner = await this.assertOwner(dto.userId);

  const parametre = await this.prisma.parametreRetrait.findUnique({
    where: { userId: dto.userId },
  });

  if (!parametre || parametre.statut !== StatutParametreRetrait.VERIFIE) {
    throw new BadRequestException({
      message:
        'Le numéro de retrait doit être paramétré et vérifié avant tout retrait.',
      messageE:
        'Withdrawal number must be configured and verified before requesting a withdrawal.',
    });
  }

  const solde = await this.getDecryptedOwnerBalance(dto.userId);
  const pendingTotal = await this.getPendingTotal(dto.userId);
  const disponible = solde - pendingTotal;

  if (dto.montant > disponible) {
    throw new BadRequestException({
      message: `Solde insuffisant. Solde disponible pour retrait: ${disponible}`,
      messageE: `Insufficient balance. Available balance for withdrawal: ${disponible}`,
    });
  }

  const otp = this.generateOtpCode();
  const otpHash = await this.hashOtp(otp);
  const otpExpiresAt = this.buildOtpExpiresAt(10);

  const retrait = await this.prisma.retrait.create({
    data: {
      userId: dto.userId,
      parametreRetraitId: parametre.parametreRetraitId,
      montant: dto.montant,
      statut: StatutRetrait.OTP_EN_ATTENTE,
      numeroRetraitSnapshot: parametre.numeroRetrait, // seulement ça
      otpHash,
      otpExpiresAt,
    },
  });

  await this.sendOtpByEmail(
    owner.email,
    'Confirmation de votre demande de retrait',
    otp,
    'la confirmation de votre demande de retrait',
  );

  return {
    message: 'OTP envoyé pour confirmer la demande de retrait',
    messageE: 'OTP sent to confirm withdrawal request',
    data: {
      retraitId: retrait.retraitId,
      userId: retrait.userId,
      montant: retrait.montant,
      statut: retrait.statut,
      numeroRetraitSnapshot: retrait.numeroRetraitSnapshot,
      otpExpiresAt: retrait.otpExpiresAt,
      soldeActuel: solde,
      totalPending: pendingTotal,
      disponible,
    },
  };
}

  async verifyRetraitOtp(retraitId: number, dto: VerifyRetraitOtpDto) {
    const retrait = await this.prisma.retrait.findUnique({
      where: { retraitId },
    });

    if (!retrait) {
      throw new NotFoundException({
        message: 'Demande de retrait introuvable.',
        messageE: 'Withdrawal request not found.',
      });
    }

    if (retrait.statut !== StatutRetrait.OTP_EN_ATTENTE) {
      throw new BadRequestException({
        message: 'Cette demande n’attend plus de validation OTP.',
        messageE: 'This request is no longer waiting for OTP validation.',
      });
    }

    if (!retrait.otpHash || !retrait.otpExpiresAt) {
      throw new BadRequestException({
        message: 'Aucun OTP en attente pour ce retrait.',
        messageE: 'No pending OTP for this withdrawal.',
      });
    }

    if (new Date() > retrait.otpExpiresAt) {
      throw new BadRequestException({
        message: 'OTP expiré.',
        messageE: 'OTP expired.',
      });
    }

    const isValid = await this.compareOtp(dto.otp, retrait.otpHash);
    if (!isValid) {
      throw new BadRequestException({
        message: 'OTP invalide.',
        messageE: 'Invalid OTP.',
      });
    }

    const solde = await this.getDecryptedOwnerBalance(retrait.userId);
    const pendingTotal = await this.getPendingTotal(
      retrait.userId,
      retrait.retraitId,
    );
    const disponible = solde - pendingTotal;

    if (Number(retrait.montant) > disponible) {
      throw new BadRequestException({
        message: `Solde insuffisant au moment de la validation OTP. Disponible: ${disponible}`,
        messageE: `Insufficient balance at OTP validation. Available: ${disponible}`,
      });
    }

    const updated = await this.prisma.retrait.update({
      where: { retraitId },
      data: {
        statut: StatutRetrait.PENDING,
        otpValidatedAt: new Date(),
        otpHash: null,
        otpExpiresAt: null,
      },
    });

    return {
      message: 'Demande de retrait confirmée et mise en attente',
      messageE: 'Withdrawal request confirmed and set to pending',
      data: updated,
    };
  }

  async getMesRetraits(query: QueryRetraitDto) {
    if (!query.userId) {
      throw new BadRequestException({
        message: 'userId est obligatoire.',
        messageE: 'userId is required.',
      });
    }

    await this.assertOwner(query.userId);

    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      userId: query.userId,
    };

    if (query.statut) {
      where.statut = query.statut;
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.retrait.findMany({
        where,
        skip,
        take: limit,
        orderBy: { demandeLe: 'desc' },
        include: {
          parametreRetrait: {
            select: {
              parametreRetraitId: true,
              numeroRetrait: true,
            },
          },
          completeParAdmin: {
            select: {
              userId: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
      this.prisma.retrait.count({ where }),
    ]);

    return {
      message: 'Historique des retraits récupéré avec succès',
      messageE: 'Withdrawal history retrieved successfully',
      data: items,
      meta: {
        total,
        page,
        limit,
        pageCount: Math.ceil(total / limit),
      },
    };
  }

  async getAllRetraitsAdmin(query: QueryRetraitDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.statut) {
      where.statut = query.statut;
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.retrait.findMany({
        where,
        skip,
        take: limit,
        orderBy: { demandeLe: 'desc' },
        include: {
          user: {
            select: {
              userId: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              userType: true,
            },
          },
          parametreRetrait: {
            select: {
              parametreRetraitId: true,
              numeroRetrait: true,
            },
          },
          completeParAdmin: {
            select: {
              userId: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
      this.prisma.retrait.count({ where }),
    ]);

    return {
      message: 'Liste complète des retraits récupérée avec succès',
      messageE: 'Full withdrawal list retrieved successfully',
      data: items,
      meta: {
        total,
        page,
        limit,
        pageCount: Math.ceil(total / limit),
      },
    };
  }

  async completeRetrait(retraitId: number, dto: CompleteRetraitDto) {
    await this.assertAdmin(dto.adminId);

    const retrait = await this.prisma.retrait.findUnique({
      where: { retraitId },
    });

    if (!retrait) {
      throw new NotFoundException({
        message: 'Retrait introuvable.',
        messageE: 'Withdrawal not found.',
      });
    }

    if (retrait.statut !== StatutRetrait.PENDING) {
      throw new BadRequestException({
        message: 'Seuls les retraits PENDING peuvent être complétés.',
        messageE: 'Only PENDING withdrawals can be completed.',
      });
    }

    await this.prisma.$transaction(async (tx) => {
      const soldeRow = await tx.soldeMedecin.findFirst({
        where: { medecinId: retrait.userId },
      });

      if (!soldeRow) {
        throw new BadRequestException({
          message: 'Solde introuvable pour cet utilisateur.',
          messageE: 'Balance not found for this user.',
        });
      }

      let result: { encrypted: string; balance: number };

      try {
        result = subtractFromEncryptedBalance(
          soldeRow.solde,
          Number(retrait.montant),
        );
      } catch (error) {
        throw new BadRequestException({
          message: `Impossible de compléter le retrait: ${error.message}`,
          messageE: `Unable to complete withdrawal: ${error.message}`,
        });
      }

      await tx.soldeMedecin.update({
        where: { soldeMedecinId: soldeRow.soldeMedecinId },
        data: { solde: result.encrypted },
      });

      await tx.retrait.update({
        where: { retraitId },
        data: {
          statut: StatutRetrait.COMPLETED,
          completeLe: new Date(),
          completeParAdminId: dto.adminId,
          referenceTraitementAdmin: dto.referenceTraitementAdmin || null,
        },
      });
    });

    return {
      message: 'Retrait complété avec succès et solde mis à jour',
      messageE: 'Withdrawal completed successfully and balance updated',
    };
  }

  async cancelRetrait(retraitId: number, dto: CancelRetraitDto) {
    const retrait = await this.prisma.retrait.findUnique({
      where: { retraitId },
    });

    if (!retrait) {
      throw new NotFoundException({
        message: 'Retrait introuvable.',
        messageE: 'Withdrawal not found.',
      });
    }

    const actor = await this.prisma.user.findUnique({
      where: { userId: dto.acteurId },
      select: {
        userId: true,
        userType: true,
      },
    });

    if (!actor) {
      throw new NotFoundException({
        message: 'Acteur introuvable.',
        messageE: 'Actor not found.',
      });
    }

    const isAdmin =
      actor.userType === UserType.ADMIN ||
      actor.userType === UserType.SUPERADMIN;

    const isOwner = retrait.userId === actor.userId;

    if (!isAdmin && !isOwner) {
      throw new ForbiddenException({
        message: 'Vous ne pouvez pas annuler ce retrait.',
        messageE: 'You cannot cancel this withdrawal.',
      });
    }

    const cancellable =
      retrait.statut === StatutRetrait.OTP_EN_ATTENTE ||
      retrait.statut === StatutRetrait.PENDING;

    if (!cancellable) {
      throw new BadRequestException({
        message:
          'Seuls les retraits OTP_EN_ATTENTE ou PENDING peuvent être annulés.',
        messageE:
          'Only OTP_EN_ATTENTE or PENDING withdrawals can be cancelled.',
      });
    }

    await this.prisma.retrait.update({
      where: { retraitId },
      data: {
        statut: StatutRetrait.CANCELLED,
        annuleLe: new Date(),
        motifAnnulation: dto.motifAnnulation || null,
        otpHash: null,
        otpExpiresAt: null,
      },
    });

    return {
      message: 'Retrait annulé avec succès',
      messageE: 'Withdrawal cancelled successfully',
    };
  }
}
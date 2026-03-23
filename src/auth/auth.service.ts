import { Injectable, UnauthorizedException, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { RequestResetDto } from './dto/request-reset.dto';
import { ConfirmResetDto } from './dto/confirm-reset.dto';
import * as bcrypt from 'bcryptjs';
import { EmailService } from 'src/utils/email.service';
import { UserType } from 'generated/prisma';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly email: EmailService,
  ) {}

  private sanitizeUser(u: any) {
    const { password, ...rest } = u;
    return rest;
  }

  private sanitizeUserForAuth(
    user: any,
    roles: any[],
    permissions: Array<{ permissionId: number; name: string; description: string | null }>,
  ) {
    const { password, roles: _roles, ...rest } = user;
    return {
      ...rest,
      roles: roles.map((r) => ({
        roleId: r.roleId,
        name: r.name,
        description: r.description ?? null,
      })),
      permissions,
    };
  }

  /** Login par téléphone + userType + mot de passe -> JWT 1 an */
  async login(dto: LoginDto) {
    try {
      const phone = dto.phone?.trim();
      const userType = dto.userType;

      // Chercher l'utilisateur par téléphone ET userType
      const user = await this.prisma.user.findFirst({
        where: { 
          phone,
          userType 
        },
        include: {
          roles: {
            include: {
              role: {
                include: {
                  permissions: {
                    include: { permission: true },
                  },
                },
              },
            },
          },
        },
      });

      if (!user) {
        throw new UnauthorizedException({
          message: `Identifiants invalides pour ${this.getUserTypeLabel(userType)}.`,
          messageE: `Invalid credentials for ${this.getUserTypeLabel(userType, true)}.`,
        });
      }

      const ok = await bcrypt.compare(dto.password, user.password);
      if (!ok) {
        throw new UnauthorizedException({
          message: `Identifiants invalides pour ${this.getUserTypeLabel(userType)}.`,
          messageE: `Invalid credentials for ${this.getUserTypeLabel(userType, true)}.`,
        });
      }

      if (user.isBlock) {
        throw new ForbiddenException({
          message: 'Votre compte est bloqué.',
          messageE: 'Your account is blocked.',
        });
      }

      if (!user.isVerified) {
        throw new ForbiddenException({
          message: "Votre compte n'est pas vérifié.",
          messageE: 'Your account is not verified.',
        });
      }

      // ✅ Rôles assignés
      const assignedRoles = (user.roles || [])
        .map((ur: any) => ur.role)
        .filter(Boolean);

      // ✅ SuperAdmin
      const isSuperAdmin = assignedRoles.some(
        (r) => r.name === 'SUPER ADMIN' || r.name === 'SUPERADMIN',
      );

      // ✅ Permissions
      let permissions: Array<{
        permissionId: number;
        name: string;
        description: string | null;
      }> = [];

      let allRoles:
        | Array<{ roleId: number; name: string; description: string | null }>
        | undefined;

      let allPermissions:
        | Array<{ permissionId: number; name: string; description: string | null }>
        | undefined;

      if (isSuperAdmin) {
        const [rolesDb, permissionsDb] = await this.prisma.$transaction([
          this.prisma.role.findMany({
            select: { roleId: true, name: true, description: true },
            orderBy: { name: 'asc' },
          }),
          this.prisma.permission.findMany({
            select: { permissionId: true, name: true, description: true },
            orderBy: { name: 'asc' },
          }),
        ]);

        allRoles = rolesDb;
        allPermissions = permissionsDb;
        permissions = permissionsDb;
      } else {
        const map = new Map<
          number,
          { permissionId: number; name: string; description: string | null }
        >();

        for (const role of assignedRoles) {
          for (const link of role.permissions || []) {
            if (link.permission) {
              map.set(link.permission.permissionId, {
                permissionId: link.permission.permissionId,
                name: link.permission.name,
                description: link.permission.description ?? null,
              });
            }
          }
        }

        permissions = Array.from(map.values()).sort((a, b) =>
          a.name.localeCompare(b.name),
        );
      }

      const payload = { 
        sub: user.userId, 
        phone: user.phone, 
        userType: user.userType,
        email: user.email 
      };
      const token = await this.jwt.signAsync(payload, { expiresIn: '365d' });

      // ✅ sauvegarder le expotoken si entré
      const expo = dto.expotoken?.trim();
      if (expo) {
        await this.prisma.user.update({
          where: { userId: user.userId },
          data: { expotoken: expo },
        });
      }

      // ✅ user safe + roles + permissions
      const userSafe = this.sanitizeUserForAuth(user, assignedRoles, permissions);

      return {
        message: 'Connexion réussie.',
        messageE: 'Login successful.',
        token,
        user: userSafe,
        roles: assignedRoles.map((r) => ({
          roleId: r.roleId,
          name: r.name,
          description: r.description ?? null,
        })),
        permissions,
        ...(isSuperAdmin ? { allRoles, allPermissions } : {}),
      };
    } catch (error) {
      if (error instanceof UnauthorizedException || error instanceof ForbiddenException) throw error;
      throw new BadRequestException({
        message: `Erreur de connexion : ${error.message}`,
        messageE: `Login error: ${error.message}`,
      });
    }
  }

  private getUserTypeLabel(userType: UserType, english: boolean = false): string {
    if (english) {
      switch (userType) {
        case UserType.PATIENT: return 'patient';
        case UserType.MEDECIN: return 'doctor';
        case UserType.HOPITAL: return 'hospital';
        case UserType.ADMIN: return 'admin';
        case UserType.SUPERADMIN: return 'super admin';
        default: return 'user';
      }
    }
    
    switch (userType) {
      case UserType.PATIENT: return 'patient';
      case UserType.MEDECIN: return 'médecin';
      case UserType.HOPITAL: return 'hôpital';
      case UserType.ADMIN: return 'administrateur';
      case UserType.SUPERADMIN: return 'super administrateur';
      default: return 'utilisateur';
    }
  }

  /** Changer le mot de passe (via userId issu du JWT) */
  async changePassword(userId: number, dto: ChangePasswordDto) {
    try {
      const user = await this.prisma.user.findUnique({ where: { userId } });
      if (!user) {
        throw new NotFoundException({
          message: `Utilisateur ${userId} introuvable.`,
          messageE: `User ${userId} not found.`,
        });
      }
      const ok = await bcrypt.compare(dto.oldPassword, user.password);
      if (!ok) {
        throw new UnauthorizedException({
          message: 'Ancien mot de passe incorrect.',
          messageE: 'Old password is incorrect.',
        });
      }
      const hash = await bcrypt.hash(dto.newPassword, 10);
      await this.prisma.user.update({ where: { userId }, data: { password: hash } });
      return {
        message: 'Mot de passe modifié avec succès.',
        messageE: 'Password changed successfully.',
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof UnauthorizedException
      ) throw error;
      throw new BadRequestException({
        message: `Erreur modification mot de passe : ${error.message}`,
        messageE: `Password change error: ${error.message}`,
      });
    }
  }

  /** Demander un OTP par email */
  async requestReset(dto: RequestResetDto) {
    try {
      const user = await this.prisma.user.findFirst({ where: { email: dto.email } });
      if (!user) {
        return {
          message: 'Si un compte existe, un OTP a été envoyé.',
          messageE: 'If an account exists, an OTP was sent.',
        };
      }
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpHash = await bcrypt.hash(otp, 10);
      const expires = new Date(Date.now() + 10 * 60 * 1000);

      await this.prisma.passwordReset.create({
        data: {
          userId: user.userId,
          email: user.email,
          otpHash,
          expiresAt: expires,
        },
      });

      const subject = 'Réinitialisation du mot de passe / Password reset';
      const body = `FR: Votre code OTP est ${otp}. Il expire dans 10 minutes.
EN: Your OTP code is ${otp}. It expires in 10 minutes.`;
      await this.email.sendEmail(subject, body, user.email);

      return {
        message: 'OTP envoyé par email.',
        messageE: 'OTP sent by email.',
      };
    } catch (error) {
      throw new BadRequestException({
        message: `Erreur demande OTP : ${error.message}`,
        messageE: `OTP request error: ${error.message}`,
      });
    }
  }

  /** Confirmer OTP et réinitialiser le mot de passe */
  async confirmReset(dto: ConfirmResetDto) {
    try {
      const reset = await this.prisma.passwordReset.findFirst({
        where: {
          email: dto.email,
          usedAt: null,
          expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: 'desc' },
      });
      if (!reset) {
        throw new BadRequestException({
          message: 'OTP invalide ou expiré.',
          messageE: 'Invalid or expired OTP.',
        });
      }
      const ok = await bcrypt.compare(dto.otp, reset.otpHash);
      if (!ok) {
        throw new UnauthorizedException({
          message: 'OTP incorrect.',
          messageE: 'Incorrect OTP.',
        });
      }
      const user = await this.prisma.user.findUnique({ where: { userId: reset.userId } });
      if (!user) {
        throw new NotFoundException({
          message: 'Utilisateur introuvable.',
          messageE: 'User not found.',
        });
      }
      const hash = await bcrypt.hash(dto.newPassword, 10);
      await this.prisma.$transaction([
        this.prisma.user.update({ where: { userId: user.userId }, data: { password: hash } }),
        this.prisma.passwordReset.update({ where: { id: reset.id }, data: { usedAt: new Date() } }),
      ]);

      return {
        message: 'Mot de passe réinitialisé avec succès.',
        messageE: 'Password reset successfully.',
      };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof UnauthorizedException ||
        error instanceof NotFoundException
      ) throw error;
      throw new BadRequestException({
        message: `Erreur reset mot de passe : ${error.message}`,
        messageE: `Password reset error: ${error.message}`,
      });
    }
  }
}
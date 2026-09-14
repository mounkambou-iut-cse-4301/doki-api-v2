import { Test, TestingModule } from '@nestjs/testing';
import {
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { EmailService } from 'src/utils/email.service';
import { UserType } from 'generated/prisma';
import * as bcrypt from 'bcryptjs';

jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

const prisma = {
  user: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  role: { findMany: jest.fn() },
  permission: { findMany: jest.fn() },
  passwordReset: {
    findFirst: jest.fn(),
    updateMany: jest.fn(),
    create: jest.fn(),
  },
  $transaction: jest.fn(),
};

const jwt = { signAsync: jest.fn() };
const email = { sendEmail: jest.fn() };

function buildUser(overrides: any = {}) {
  return {
    userId: 1,
    phone: '+212600000000',
    email: 'test@test.com',
    password: 'hashedpwd',
    userType: UserType.PATIENT,
    isBlock: false,
    isVerified: true,
    expotoken: null,
    roles: [
      {
        role: {
          roleId: 1,
          name: 'PATIENT',
          description: 'Patient role',
          permissions: [
            {
              permission: {
                permissionId: 10,
                name: 'READ_OWN_DATA',
                description: 'Read own data',
              },
            },
          ],
        },
      },
    ],
    ...overrides,
  };
}

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwt },
        { provide: EmailService, useValue: email },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  // ─── LOGIN ──────────────────────────────────────────────
  describe('login', () => {
    const loginDto = {
      phone: '+212600000000',
      password: 'secret123',
      userType: UserType.PATIENT,
      expotoken: '',
    };

    it('should throw UnauthorizedException when user is not found', async () => {
      prisma.user.findFirst.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when password is wrong', async () => {
      prisma.user.findFirst.mockResolvedValue(buildUser());
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw ForbiddenException when user is blocked', async () => {
      prisma.user.findFirst.mockResolvedValue(buildUser({ isBlock: true }));
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(service.login(loginDto)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw ForbiddenException when user is not verified', async () => {
      prisma.user.findFirst.mockResolvedValue(buildUser({ isVerified: false }));
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(service.login(loginDto)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should return token, user, roles, and permissions for a normal user', async () => {
      const user = buildUser();
      prisma.user.findFirst.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jwt.signAsync.mockResolvedValue('jwt-token-abc');

      const result = await service.login(loginDto);

      expect(result.token).toBe('jwt-token-abc');
      expect(result.user).toBeDefined();
      expect(result.roles).toHaveLength(1);
      expect(result.permissions).toBeDefined();
      expect(result.allRoles).toBeUndefined();
      expect(result.allPermissions).toBeUndefined();
      expect(jwt.signAsync).toHaveBeenCalledWith(
        {
          sub: user.userId,
          phone: user.phone,
          userType: user.userType,
          email: user.email,
        },
        { expiresIn: '365d' },
      );
    });

    it('should return allRoles and allPermissions for SUPERADMIN', async () => {
      const superAdminUser = buildUser({
        roles: [
          {
            role: {
              roleId: 99,
              name: 'SUPER ADMIN',
              description: 'Super admin',
              permissions: [],
            },
          },
        ],
      });
      prisma.user.findFirst.mockResolvedValue(superAdminUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jwt.signAsync.mockResolvedValue('jwt-super');

      const allRoles = [
        { roleId: 1, name: 'PATIENT', description: null },
        { roleId: 99, name: 'SUPER ADMIN', description: null },
      ];
      const allPermissions = [
        { permissionId: 1, name: 'READ', description: null },
      ];
      prisma.role.findMany.mockResolvedValue(allRoles);
      prisma.permission.findMany.mockResolvedValue(allPermissions);
      prisma.$transaction.mockResolvedValue([allRoles, allPermissions]);

      const result = await service.login({
        ...loginDto,
        userType: UserType.SUPERADMIN,
      });

      expect(result.allRoles).toEqual(allRoles);
      expect(result.allPermissions).toEqual(allPermissions);
      expect(result.permissions).toEqual(allPermissions);
    });

    it('should save expotoken when provided', async () => {
      const user = buildUser();
      prisma.user.findFirst.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jwt.signAsync.mockResolvedValue('jwt-token');
      prisma.user.update.mockResolvedValue({});

      await service.login({ ...loginDto, expotoken: 'ExpoPushToken123' });

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { userId: user.userId },
        data: { expotoken: 'ExpoPushToken123' },
      });
    });

    it('should throw BadRequestException on unexpected error', async () => {
      prisma.user.findFirst.mockRejectedValue(new Error('DB down'));

      await expect(service.login(loginDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ─── CHANGE PASSWORD ─────────────────────────────────────
  describe('changePassword', () => {
    const dto = { oldPassword: 'old123', newPassword: 'newSecure1' };

    it('should throw NotFoundException when user is not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.changePassword(999, dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw UnauthorizedException when old password is wrong', async () => {
      prisma.user.findUnique.mockResolvedValue(buildUser());
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.changePassword(1, dto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should return success message on success', async () => {
      prisma.user.findUnique.mockResolvedValue(buildUser());
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('newHashed');
      prisma.user.update.mockResolvedValue({});

      const result = await service.changePassword(1, dto);

      expect(result.message).toBeDefined();
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { userId: 1 },
        data: { password: 'newHashed' },
      });
    });
  });

  // ─── REQUEST RESET ──────────────────────────────────────
  describe('requestReset', () => {
    const dto = { email: 'test@test.com', userType: UserType.PATIENT };

    it('should return success message even when user is not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const result = await service.requestReset(dto);

      expect(result.message).toBeDefined();
      expect(prisma.passwordReset.create).not.toHaveBeenCalled();
      expect(email.sendEmail).not.toHaveBeenCalled();
    });

    it('should send OTP when user exists', async () => {
      const user = buildUser();
      prisma.user.findUnique.mockResolvedValue(user);
      (bcrypt.hash as jest.Mock).mockResolvedValue('otpHashed');
      prisma.$transaction.mockImplementation(async (fn) => fn({
        passwordReset: {
          updateMany: prisma.passwordReset.updateMany,
          create: prisma.passwordReset.create,
        },
      }));

      const result = await service.requestReset(dto);

      expect(result.message).toBeDefined();
      expect(prisma.$transaction).toHaveBeenCalled();
      expect(email.sendEmail).toHaveBeenCalled();
    });

    it('should throw BadRequestException on error', async () => {
      prisma.user.findUnique.mockRejectedValue(new Error('DB error'));

      await expect(service.requestReset(dto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ─── CONFIRM RESET ─────────────────────────────────────
  describe('confirmReset', () => {
    const dto = {
      email: 'test@test.com',
      userType: UserType.PATIENT,
      otp: '123456',
      newPassword: 'brandNew1',
    };

    it('should throw BadRequestException when user is not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.confirmReset(dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when no reset record exists', async () => {
      prisma.user.findUnique.mockResolvedValue(buildUser());
      prisma.passwordReset.findFirst.mockResolvedValue(null);

      await expect(service.confirmReset(dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw UnauthorizedException when OTP is wrong', async () => {
      prisma.user.findUnique.mockResolvedValue(buildUser());
      prisma.passwordReset.findFirst.mockResolvedValue({
        id: 1,
        otpHash: 'hash',
        userId: 1,
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.confirmReset(dto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should return success message on valid OTP', async () => {
      prisma.user.findUnique.mockResolvedValue(buildUser());
      prisma.passwordReset.findFirst.mockResolvedValue({
        id: 1,
        otpHash: 'hash',
        userId: 1,
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('newHashed');
      prisma.$transaction.mockResolvedValue([{}, {}]);

      const result = await service.confirmReset(dto);

      expect(result.message).toBeDefined();
      expect(prisma.$transaction).toHaveBeenCalled();
    });
  });
});

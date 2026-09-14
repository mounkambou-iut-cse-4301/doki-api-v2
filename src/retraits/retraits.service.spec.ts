import { Test, TestingModule } from '@nestjs/testing';
import { RetraitsService } from './retraits.service';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../utils/email.service';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';

jest.mock('src/utils/secure-balance', () => ({
  decryptBalance: jest.fn(() => 100000),
  subtractFromEncryptedBalance: jest.fn(() => ({ encrypted: 'new-encrypted', balance: 90000 })),
}));

describe('RetraitsService', () => {
  let service: RetraitsService;
  let prisma: Record<string, any>;
  let emailService: Record<string, jest.Mock>;

  beforeEach(async () => {
    prisma = {
      user: { findUnique: jest.fn() },
      parametreRetrait: { findUnique: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn() },
      soldeMedecin: { findFirst: jest.fn(), update: jest.fn() },
      retrait: { findUnique: jest.fn(), findMany: jest.fn(), count: jest.fn(), aggregate: jest.fn(), create: jest.fn(), update: jest.fn() },
      $transaction: jest.fn(async (fnOrArray: any) => {
        if (Array.isArray(fnOrArray)) return Promise.all(fnOrArray);
        return fnOrArray(prisma);
      }),
    };
    emailService = { sendEmail: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RetraitsService,
        { provide: PrismaService, useValue: prisma },
        { provide: EmailService, useValue: emailService },
      ],
    }).compile();

    service = module.get(RetraitsService);
  });

  describe('createParametre', () => {
    it('should throw if user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service.createParametre({ userId: 999, numeroRetrait: '+22500000000' })).rejects.toThrow(NotFoundException);
    });
    it('should throw if parameter already exists', async () => {
      prisma.user.findUnique.mockResolvedValue({ userId: 1, userType: 'MEDECIN', email: 'dr@mail.com' });
      prisma.parametreRetrait.findUnique.mockResolvedValue({ parametreRetraitId: 1 });
      await expect(service.createParametre({ userId: 1, numeroRetrait: '+22500000000' })).rejects.toThrow(BadRequestException);
    });
    it('should create parameter and send OTP', async () => {
      prisma.user.findUnique.mockResolvedValue({ userId: 1, userType: 'MEDECIN', email: 'dr@mail.com' });
      prisma.parametreRetrait.findUnique.mockResolvedValue(null);
      prisma.parametreRetrait.findFirst.mockResolvedValue(null);
      prisma.parametreRetrait.create.mockResolvedValue({ parametreRetraitId: 1, userId: 1, numeroRetrait: '+22500000000', statut: 'OTP_EN_ATTENTE', otpExpiresAt: new Date() });
      const result = await service.createParametre({ userId: 1, numeroRetrait: '+22500000000' });
      expect(result.data.parametreRetraitId).toBe(1);
      expect(emailService.sendEmail).toHaveBeenCalled();
    });
  });

  describe('getParametreByUserId', () => {
    it('should throw if user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service.getParametreByUserId(999)).rejects.toThrow(NotFoundException);
    });
    it('should throw if parameter not found', async () => {
      prisma.user.findUnique.mockResolvedValue({ userId: 1, userType: 'MEDECIN' });
      prisma.parametreRetrait.findUnique.mockResolvedValue(null);
      await expect(service.getParametreByUserId(1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('demanderRetrait', () => {
    it('should throw if parameter not verified', async () => {
      prisma.user.findUnique.mockResolvedValue({ userId: 1, userType: 'MEDECIN', email: 'dr@mail.com' });
      prisma.parametreRetrait.findUnique.mockResolvedValue({ parametreRetraitId: 1, statut: 'OTP_EN_ATTENTE', numeroRetrait: '+22500000000' });
      await expect(service.demanderRetrait({ userId: 1, montant: 5000 })).rejects.toThrow(BadRequestException);
    });
    it('should throw if insufficient balance', async () => {
      prisma.user.findUnique.mockResolvedValue({ userId: 1, userType: 'MEDECIN', email: 'dr@mail.com' });
      prisma.parametreRetrait.findUnique.mockResolvedValue({ parametreRetraitId: 1, statut: 'VERIFIE', numeroRetrait: '+22500000000' });
      prisma.soldeMedecin.findFirst.mockResolvedValue({ soldeMedecinId: 1, solde: 'enc' });
      prisma.retrait.aggregate.mockResolvedValue({ _sum: { montant: 100000 } });
      await expect(service.demanderRetrait({ userId: 1, montant: 5000 })).rejects.toThrow(BadRequestException);
    });
    it('should create retrait and send OTP', async () => {
      prisma.user.findUnique.mockResolvedValue({ userId: 1, userType: 'MEDECIN', email: 'dr@mail.com' });
      prisma.parametreRetrait.findUnique.mockResolvedValue({ parametreRetraitId: 1, statut: 'VERIFIE', numeroRetrait: '+22500000000' });
      prisma.soldeMedecin.findFirst.mockResolvedValue({ soldeMedecinId: 1, solde: 'enc' });
      prisma.retrait.aggregate.mockResolvedValue({ _sum: { montant: 0 } });
      prisma.retrait.create.mockResolvedValue({ retraitId: 1, userId: 1, montant: 5000, statut: 'OTP_EN_ATTENTE', numeroRetraitSnapshot: '+22500000000', otpExpiresAt: new Date() });
      const result = await service.demanderRetrait({ userId: 1, montant: 5000 });
      expect(result.data.retraitId).toBe(1);
      expect(emailService.sendEmail).toHaveBeenCalled();
    });
  });

  describe('verifyRetraitOtp', () => {
    it('should throw if retrait not found', async () => {
      prisma.retrait.findUnique.mockResolvedValue(null);
      await expect(service.verifyRetraitOtp(999, { otp: '123456' })).rejects.toThrow(NotFoundException);
    });
    it('should throw if not in OTP_EN_ATTENTE', async () => {
      prisma.retrait.findUnique.mockResolvedValue({ retraitId: 1, statut: 'PENDING' });
      await expect(service.verifyRetraitOtp(1, { otp: '123456' })).rejects.toThrow(BadRequestException);
    });
    it('should throw if OTP expired', async () => {
      prisma.retrait.findUnique.mockResolvedValue({ retraitId: 1, statut: 'OTP_EN_ATTENTE', otpHash: 'abc', otpExpiresAt: new Date(Date.now() - 10000) });
      await expect(service.verifyRetraitOtp(1, { otp: '123456' })).rejects.toThrow(BadRequestException);
    });
  });

  describe('completeRetrait', () => {
    it('should throw if admin not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service.completeRetrait(1, { adminId: 999 } as any)).rejects.toThrow(NotFoundException);
    });
    it('should throw if not admin', async () => {
      prisma.user.findUnique.mockResolvedValue({ userId: 5, userType: 'MEDECIN' });
      await expect(service.completeRetrait(1, { adminId: 5 } as any)).rejects.toThrow(ForbiddenException);
    });
    it('should throw if retrait not found', async () => {
      prisma.user.findUnique.mockResolvedValue({ userId: 1, userType: 'ADMIN' });
      prisma.retrait.findUnique.mockResolvedValue(null);
      await expect(service.completeRetrait(1, { adminId: 1 } as any)).rejects.toThrow(NotFoundException);
    });
  });

  describe('cancelRetrait', () => {
    it('should throw if retrait not found', async () => {
      prisma.retrait.findUnique.mockResolvedValue(null);
      await expect(service.cancelRetrait(1, { acteurId: 1 } as any)).rejects.toThrow(NotFoundException);
    });
    it('should throw if actor not found', async () => {
      prisma.retrait.findUnique.mockResolvedValue({ retraitId: 1, statut: 'PENDING', userId: 1 });
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service.cancelRetrait(1, { acteurId: 999 } as any)).rejects.toThrow(NotFoundException);
    });
    it('should cancel retrait', async () => {
      prisma.retrait.findUnique.mockResolvedValue({ retraitId: 1, statut: 'PENDING', userId: 1, montant: 5000, user: { email: 'dr@mail.com' } });
      prisma.user.findUnique.mockResolvedValue({ userId: 1, userType: 'ADMIN' });
      prisma.retrait.update.mockResolvedValue({ retraitId: 1 });
      const result = await service.cancelRetrait(1, { acteurId: 1 });
      expect(result.messageE).toContain('cancelled');
      expect(emailService.sendEmail).toHaveBeenCalled();
    });
  });

  describe('getMesRetraits', () => {
    it('should throw if userId missing', async () => {
      await expect(service.getMesRetraits({})).rejects.toThrow(BadRequestException);
    });
    it('should return history', async () => {
      prisma.user.findUnique.mockResolvedValue({ userId: 1, userType: 'MEDECIN' });
      prisma.retrait.findMany.mockResolvedValue([]);
      prisma.retrait.count.mockResolvedValue(0);
      const result = await service.getMesRetraits({ userId: 1 });
      expect(result.data).toEqual([]);
    });
  });
});
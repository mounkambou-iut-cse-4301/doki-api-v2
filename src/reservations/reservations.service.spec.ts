import { Test, TestingModule } from '@nestjs/testing';
import { ReservationsService } from './reservations.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

jest.mock('src/utils/secure-balance', () => ({
  decryptBalance: () => 100000,
  addToEncryptedBalance: (enc: string, amt: number) => ({ encrypted: 'new-enc', balance: amt }),
  encryptBalance: (amt: number) => 'enc-' + amt,
}));
jest.mock('src/utils/cloudinary', () => ({ uploadImageToCloudinary: jest.fn() }));
jest.mock('src/utils/expo-push', () => ({ bi: (s: string) => s, sendExpoPush: jest.fn(), isValidExpoToken: () => false }));

describe('ReservationsService', () => {
  let service: ReservationsService;
  let prisma: Record<string, any>;

  beforeEach(async () => {
    prisma = {
      reservation: { findUnique: jest.fn(), findMany: jest.fn(), count: jest.fn(), create: jest.fn(), update: jest.fn() },
      user: { findUnique: jest.fn() },
      speciality: { findUnique: jest.fn() },
      planning: { findFirst: jest.fn(), findMany: jest.fn() },
      setting: { findFirst: jest.fn() },
      soldeMedecin: { findFirst: jest.fn(), create: jest.fn(), update: jest.fn() },
      feedback: { aggregate: jest.fn(), findMany: jest.fn() },
      transaction: { update: jest.fn() },
      notification: { create: jest.fn() },
      abonnement: { findMany: jest.fn(), update: jest.fn() },
      $transaction: jest.fn((fns: any[]) => Promise.all(fns)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [ReservationsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(ReservationsService);
  });

  describe('findOne', () => {
    it('should throw if not found', async () => {
      prisma.reservation.findUnique.mockResolvedValue(null);
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
    it('should return reservation with rating', async () => {
      prisma.reservation.findUnique.mockResolvedValue({
        reservationId: 1,
        medecinId: 10,
        hour: '08:00',
        medecin: { speciality: { consultationDuration: 30 } },
      });
      prisma.feedback.aggregate.mockResolvedValue({ _avg: { note: 4.5 }, _count: { _all: 3 } });
      prisma.feedback.findMany.mockResolvedValue([]);
      const result = await service.findOne(1);
      expect(result.data.reservationId).toBe(1);
      expect(result.medecinRating.average).toBe(4.5);
    });
  });

  describe('findAll', () => {
    it('should return paginated reservations', async () => {
      prisma.reservation.findMany.mockResolvedValue([]);
      prisma.reservation.count.mockResolvedValue(0);
      const result = await service.findAll({});
      expect(result.data).toEqual([]);
    });
  });

  describe('startConsultation', () => {
    it('should throw if reservation not found', async () => {
      prisma.reservation.findUnique.mockResolvedValue(null);
      await expect(service.startConsultation(999, 1)).rejects.toThrow(NotFoundException);
    });
    it('should throw if status not PENDING', async () => {
      prisma.reservation.findUnique.mockResolvedValue({ reservationId: 1, status: 'COMPLETED' });
      await expect(service.startConsultation(1, 1)).rejects.toThrow(BadRequestException);
    });
    it('should start consultation', async () => {
      const futureStart = new Date(Date.now() - 1000).toISOString();
      prisma.reservation.findUnique.mockResolvedValue({
        reservationId: 1, status: 'PENDING', date: '2025-01-01', hour: '08:00',
        medecin: { speciality: { consultationDuration: 30 } },
      });
      prisma.planning.findFirst.mockResolvedValue(null);
      prisma.reservation.update.mockResolvedValue({ reservationId: 1, status: 'STARTED' });
      const result = await service.startConsultation(1, 1);
      expect(result.success).toBe(true);
    });
  });

  describe('completeConsultation', () => {
    it('should throw if reservation not found', async () => {
      prisma.reservation.findUnique.mockResolvedValue(null);
      await expect(service.completeConsultation(999, 1)).rejects.toThrow(NotFoundException);
    });
    it('should throw for invalid status', async () => {
      prisma.reservation.findUnique.mockResolvedValue({
        reservationId: 1, status: 'CANCELLED', type: 'CALL',
        medecin: { speciality: { consultationPrice: 5000, consultationDuration: 30 } },
        hopital: null, patient: { expotoken: null },
      });
      await expect(service.completeConsultation(1, 1)).rejects.toThrow(BadRequestException);
    });
    it('should complete CALL consultation and credit balance', async () => {
      prisma.reservation.findUnique.mockResolvedValue({
        reservationId: 1, status: 'STARTED', type: 'CALL',
        date: '2025-01-01', hour: '08:00', patientId: 2, medecinId: 3,
        medecin: { firstName: 'Dr', lastName: 'X', speciality: { consultationPrice: 5000, consultationDuration: 30 } },
        hopital: null, patient: { expotoken: null }, amount: 0, transactionId: null,
      });
      prisma.setting.findFirst.mockResolvedValue({ onlineType: 'PERCENTAGE', onlineValue: 10, onsiteType: 'PERCENTAGE', onsiteValue: 10 });
      prisma.soldeMedecin.findFirst.mockResolvedValue(null);
      prisma.soldeMedecin.create.mockResolvedValue({});
      prisma.reservation.update.mockResolvedValue({ reservationId: 1, status: 'COMPLETED' });
      const result = await service.completeConsultation(1, 3);
      expect(result.success).toBe(true);
      expect(result.details.platformCommission).toBe(500);
      expect(result.details.amountCredited).toBe(4500);
    });
  });

  describe('rateDoctor', () => {
    it('should throw if reservation not found', async () => {
      prisma.reservation.findUnique.mockResolvedValue(null);
      await expect(service.rateDoctor(999, {} as any)).rejects.toThrow(NotFoundException);
    });
    it('should throw if reservation not COMPLETED', async () => {
      prisma.reservation.findUnique.mockResolvedValue({ reservationId: 1, status: 'PENDING' });
      await expect(service.rateDoctor(1, {} as any)).rejects.toThrow(BadRequestException);
    });
  });
});
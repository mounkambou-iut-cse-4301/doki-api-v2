import { Test, TestingModule } from '@nestjs/testing';
import { PlanningsService } from './plannings.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';

describe('PlanningsService', () => {
  let service: PlanningsService;
  let prisma: Record<string, any>;

  beforeEach(async () => {
    prisma = {
      user: { findUnique: jest.fn(), findFirst: jest.fn() },
      planning: { findUnique: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn(), deleteMany: jest.fn(), delete: jest.fn() },
      medecinHopital: { findUnique: jest.fn() },
      reservation: { findMany: jest.fn() },
      $transaction: jest.fn(async (fn: any) => fn(prisma)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [PlanningsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(PlanningsService);
  });

  describe('findByMedecin', () => {
    it('should throw if doctor not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service.findByMedecin(999)).rejects.toThrow(NotFoundException);
    });
    it('should throw if doctor has no speciality', async () => {
      prisma.user.findUnique.mockResolvedValue({ userId: 1, firstName: 'Dr', lastName: 'X', speciality: null });
      await expect(service.findByMedecin(1)).rejects.toThrow(BadRequestException);
    });
    it('should return grouped plannings', async () => {
      prisma.user.findUnique.mockResolvedValue({ userId: 1, firstName: 'Dr', lastName: 'X', speciality: { consultationPrice: 5000, consultationDuration: 30 } });
      prisma.planning.findMany.mockResolvedValue([]);
      const result = await service.findByMedecin(1);
      expect(result.plannings).toBeDefined();
      expect(result.medecinId).toBe(1);
    });
  });

  describe('updateJourStatus', () => {
    it('should throw if doctor not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service.updateJourStatus(999, { jour: 'lundi', isOff: true })).rejects.toThrow(NotFoundException);
    });
    it('should mark day as OFF', async () => {
      prisma.user.findUnique.mockResolvedValue({ userId: 1 });
      prisma.planning.deleteMany.mockResolvedValue({ count: 0 });
      prisma.planning.findFirst.mockResolvedValue(null);
      prisma.planning.create.mockResolvedValue({ planningId: 1 });
      const result = await service.updateJourStatus(1, { jour: 'lundi', isOff: true });
      expect(result.message).toContain('OFF');
    });
    it('should unmark day as OFF', async () => {
      prisma.user.findUnique.mockResolvedValue({ userId: 1 });
      prisma.planning.deleteMany.mockResolvedValue({ count: 1 });
      const result = await service.updateJourStatus(1, { jour: 'lundi', isOff: false });
      expect(result.data.isOff).toBe(false);
    });
  });

  describe('removeAll', () => {
    it('should throw if doctor not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service.removeAll(999)).rejects.toThrow(NotFoundException);
    });
    it('should throw if future reservations exist', async () => {
      prisma.user.findUnique.mockResolvedValue({ userId: 1 });
      prisma.reservation.findMany.mockResolvedValue([{ id: 1 }]);
      await expect(service.removeAll(1)).rejects.toThrow(ConflictException);
    });
    it('should delete all plannings', async () => {
      prisma.user.findUnique.mockResolvedValue({ userId: 1 });
      prisma.reservation.findMany.mockResolvedValue([]);
      prisma.planning.deleteMany.mockResolvedValue({ count: 5 });
      const result = await service.removeAll(1);
      expect(result.count).toBe(5);
    });
  });

  describe('removeSlot', () => {
    it('should throw if planning not found', async () => {
      prisma.planning.findUnique.mockResolvedValue(null);
      await expect(service.removeSlot(999)).rejects.toThrow(NotFoundException);
    });
    it('should throw if conflicting reservations exist', async () => {
      prisma.planning.findUnique.mockResolvedValue({
        planningId: 1, debutHour: '08:00:00', endHour: '09:00:00',
        medecin: { reservationsM: [{ hour: '08:30:00' }] }
      });
      await expect(service.removeSlot(1)).rejects.toThrow(ConflictException);
    });
    it('should delete planning', async () => {
      prisma.planning.findUnique.mockResolvedValue({
        planningId: 1, debutHour: '08:00:00', endHour: '09:00:00',
        medecin: { reservationsM: [] }
      });
      prisma.planning.delete.mockResolvedValue({ planningId: 1 });
      const result = await service.removeSlot(1);
      expect(result.planningId).toBe(1);
    });
  });
});

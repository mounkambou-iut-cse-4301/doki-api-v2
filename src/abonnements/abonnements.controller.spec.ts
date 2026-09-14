import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AbonnementsController } from './abonnements.controller';
import { AbonnementsService } from './abonnements.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ActiveAndVerifiedGuard } from '../auth/guards/active-verified.guard';

describe('AbonnementsController', () => {
  let controller: AbonnementsController;
  let svc: Record<string, jest.Mock>;

  beforeEach(async () => {
    svc = {
      subscribeToPackage: jest.fn(),
      getActiveSubscriptions: jest.fn(),
      getSubscriptionHistory: jest.fn(),
      getSubscriptionsBySpeciality: jest.fn(),
      findOne: jest.fn(),
      findAll: jest.fn(),
      confirm: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AbonnementsController],
      providers: [{ provide: AbonnementsService, useValue: svc }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(ActiveAndVerifiedGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get(AbonnementsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('subscribe', () => {
    it('should delegate to svc.subscribeToPackage', async () => {
      const dto = { patientId: 1, packageId: 10 } as any;
      const expected = { message: 'ok' };
      svc.subscribeToPackage.mockResolvedValue(expected);

      const result = await controller.subscribe(dto);

      expect(svc.subscribeToPackage).toHaveBeenCalledWith(dto);
      expect(result).toBe(expected);
    });
  });

  describe('getActiveSubscriptions', () => {
    it('should delegate to svc.getActiveSubscriptions', async () => {
      const result = { data: [] };
      svc.getActiveSubscriptions.mockResolvedValue(result);

      const out = await controller.getActiveSubscriptions(1, 2, 5);

      expect(svc.getActiveSubscriptions).toHaveBeenCalledWith(1, 2, 5);
      expect(out).toBe(result);
    });

    it('should throw BadRequestException when userId is missing', () => {
      expect(() =>
        controller.getActiveSubscriptions(undefined as any, 1, 10),
      ).toThrow(BadRequestException);
      expect(svc.getActiveSubscriptions).not.toHaveBeenCalled();
    });

    it('should pass undefined page/limit through', async () => {
      await controller.getActiveSubscriptions(1, undefined, undefined);
      expect(svc.getActiveSubscriptions).toHaveBeenCalledWith(
        1,
        undefined,
        undefined,
      );
    });
  });

  describe('getHistory', () => {
    it('should delegate to svc.getSubscriptionHistory', async () => {
      const query = { page: 1, limit: 10, status: 'CONFIRMED' } as any;
      const result = { data: [] };
      svc.getSubscriptionHistory.mockResolvedValue(result);

      const out = await controller.getHistory(1, query);

      expect(svc.getSubscriptionHistory).toHaveBeenCalledWith(1, query);
      expect(out).toBe(result);
    });

    it('should throw BadRequestException when userId is missing', () => {
      expect(() =>
        controller.getHistory(undefined as any, { page: 1 } as any),
      ).toThrow(BadRequestException);
      expect(svc.getSubscriptionHistory).not.toHaveBeenCalled();
    });
  });

  describe('getBySpeciality', () => {
    it('should delegate to svc.getSubscriptionsBySpeciality', async () => {
      const query = { page: 1, limit: 10 } as any;
      const result = { data: [] };
      svc.getSubscriptionsBySpeciality.mockResolvedValue(result);

      const out = await controller.getBySpeciality(9, query);

      expect(svc.getSubscriptionsBySpeciality).toHaveBeenCalledWith(9, query);
      expect(out).toBe(result);
    });

    it('should throw BadRequestException when userId is missing', () => {
      expect(() =>
        controller.getBySpeciality(undefined as any, { page: 1 } as any),
      ).toThrow(BadRequestException);
      expect(svc.getSubscriptionsBySpeciality).not.toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should delegate to svc.findOne', async () => {
      const result = { data: { abonnementId: 1 } };
      svc.findOne.mockResolvedValue(result);

      const out = await controller.findOne(1);

      expect(svc.findOne).toHaveBeenCalledWith(1);
      expect(out).toBe(result);
    });
  });

  describe('findAll', () => {
    it('should delegate to svc.findAll', async () => {
      const query = { page: 1, limit: 10 } as any;
      const result = { data: [] };
      svc.findAll.mockResolvedValue(result);

      const out = await controller.findAll(query);

      expect(svc.findAll).toHaveBeenCalledWith(query);
      expect(out).toBe(result);
    });
  });

  describe('confirm', () => {
    it('should delegate to svc.confirm', async () => {
      const result = { message: 'confirmed' };
      svc.confirm.mockResolvedValue(result);

      const out = await controller.confirm(7);

      expect(svc.confirm).toHaveBeenCalledWith(7);
      expect(out).toBe(result);
    });
  });
});

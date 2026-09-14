import { Test, TestingModule } from '@nestjs/testing';
import { HopitalController } from './hopital.controller';
import { HopitalService } from './hopital.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

describe('HopitalController', () => {
  let controller: HopitalController;
  let svc: Record<string, jest.Mock>;

  beforeEach(async () => {
    svc = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      addMedecins: jest.fn(),
      removeMedecins: jest.fn(),
      getMedecins: jest.fn(),
      getReservations: jest.fn(),
      getStats: jest.fn(),
      findAllWithDoctorFilter: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HopitalController],
      providers: [
        { provide: HopitalService, useValue: svc },
      ],
    })
      .overrideGuard(JwtAuthGuard).useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get(HopitalController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should delegate to hopitalService.create', async () => {
      const dto = { firstName: 'Hôpital Central' } as any;
      const expected = { message: 'created', data: { userId: 1 } };
      svc.create.mockResolvedValue(expected);

      const result = await controller.create(dto);

      expect(svc.create).toHaveBeenCalledWith(dto);
      expect(result).toBe(expected);
    });
  });

  describe('findAll', () => {
    it('should delegate to hopitalService.findAll when no medecinId', async () => {
      const query = { page: 1, limit: 10 } as any;
      const expected = { data: [] };
      svc.findAll.mockResolvedValue(expected);

      const result = await controller.findAll(query);

      expect(svc.findAll).toHaveBeenCalledWith(query);
      expect(result).toBe(expected);
    });

    it('should delegate to findAllWithDoctorFilter when medecinId provided', async () => {
      const query = { page: 1, limit: 10 } as any;
      const expected = { data: [] };
      svc.findAllWithDoctorFilter.mockResolvedValue(expected);

      const result = await controller.findAll(query, '42');

      expect(svc.findAllWithDoctorFilter).toHaveBeenCalledWith(query, 42);
      expect(result).toBe(expected);
    });

    it('should pass undefined medecinId as no filter', async () => {
      const query = { page: 1, limit: 10 } as any;
      svc.findAll.mockResolvedValue({ data: [] });

      await controller.findAll(query, undefined);

      expect(svc.findAll).toHaveBeenCalledWith(query);
      expect(svc.findAllWithDoctorFilter).not.toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should delegate to hopitalService.findOne', async () => {
      const expected = { data: { userId: 1 } };
      svc.findOne.mockResolvedValue(expected);

      const result = await controller.findOne(1);

      expect(svc.findOne).toHaveBeenCalledWith(1);
      expect(result).toBe(expected);
    });
  });

  describe('update', () => {
    it('should delegate to hopitalService.update', async () => {
      const dto = { firstName: 'Updated' } as any;
      const expected = { message: 'updated' };
      svc.update.mockResolvedValue(expected);

      const result = await controller.update(1, dto);

      expect(svc.update).toHaveBeenCalledWith(1, dto);
      expect(result).toBe(expected);
    });
  });

  describe('addMedecins', () => {
    it('should delegate to hopitalService.addMedecins', async () => {
      const dto = { medecinIds: [10, 20] } as any;
      const expected = { added: [], skipped: [] };
      svc.addMedecins.mockResolvedValue(expected);

      const result = await controller.addMedecins(1, dto);

      expect(svc.addMedecins).toHaveBeenCalledWith(1, dto);
      expect(result).toBe(expected);
    });
  });

  describe('removeMedecins', () => {
    it('should delegate to hopitalService.removeMedecins', async () => {
      const dto = { medecinIds: [10, 20] } as any;
      const expected = { removed: [10, 20], skipped: [] };
      svc.removeMedecins.mockResolvedValue(expected);

      const result = await controller.removeMedecins(1, dto);

      expect(svc.removeMedecins).toHaveBeenCalledWith(1, dto);
      expect(result).toBe(expected);
    });
  });

  describe('getMedecins', () => {
    it('should delegate to hopitalService.getMedecins', async () => {
      const expected = { data: [], meta: { total: 0 } };
      svc.getMedecins.mockResolvedValue(expected);

      const result = await controller.getMedecins(1, 1, 20, 'Dr A');

      expect(svc.getMedecins).toHaveBeenCalledWith(1, 1, 20, 'Dr A');
      expect(result).toBe(expected);
    });

    it('should pass undefined search when not provided', async () => {
      svc.getMedecins.mockResolvedValue({ data: [] });

      await controller.getMedecins(1, 1, 20, undefined);

      expect(svc.getMedecins).toHaveBeenCalledWith(1, 1, 20, undefined);
    });
  });

  describe('getReservations', () => {
    it('should delegate to hopitalService.getReservations', async () => {
      const query = { page: 1, limit: 10, status: 'PENDING' } as any;
      const expected = { data: [] };
      svc.getReservations.mockResolvedValue(expected);

      const result = await controller.getReservations(1, query);

      expect(svc.getReservations).toHaveBeenCalledWith(1, query);
      expect(result).toBe(expected);
    });
  });

  describe('getStats', () => {
    it('should delegate to hopitalService.getStats', async () => {
      const expected = { data: { totalMedecins: 5 } };
      svc.getStats.mockResolvedValue(expected);

      const result = await controller.getStats(1);

      expect(svc.getStats).toHaveBeenCalledWith(1);
      expect(result).toBe(expected);
    });
  });
});

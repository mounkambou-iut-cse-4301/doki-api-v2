import { Test, TestingModule } from '@nestjs/testing';
import { SpecialitiesController } from './specialities.controller';
import { SpecialitiesService } from './specialities.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ActiveAndVerifiedGuard } from '../auth/guards/active-verified.guard';

describe('SpecialitiesController', () => {
  let controller: SpecialitiesController;
  let svc: Record<string, jest.Mock>;

  const createDto = {
    name: 'Cardiologie',
    consultationPrice: 15000,
    consultationDuration: 30,
    planMonthAmount: 20000,
    numberOfTimePlanReservation: 3,
  };

  const speciality = { specialityId: 1, ...createDto };

  beforeEach(async () => {
    svc = {
      createSpecialy: jest.fn(),
      update: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SpecialitiesController],
      providers: [{ provide: SpecialitiesService, useValue: svc }],
    })
      .overrideGuard(JwtAuthGuard).useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(ActiveAndVerifiedGuard).useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get(SpecialitiesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should delegate to createSpecialy with the dto', async () => {
      svc.createSpecialy.mockResolvedValue(speciality);

      const result = await controller.create(createDto);

      expect(svc.createSpecialy).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(speciality);
    });
  });

  describe('update', () => {
    it('should delegate to update with id and dto', async () => {
      const dto = { consultationPrice: 18000 };
      svc.update.mockResolvedValue({ ...speciality, ...dto });

      const result = await controller.update(1, dto);

      expect(svc.update).toHaveBeenCalledWith(1, dto);
      expect(result.consultationPrice).toBe(18000);
    });
  });

  describe('findAll', () => {
    it('should delegate to findAll with parsed page and limit', async () => {
      const expected = [
        speciality,
        { specialityId: 2, name: 'Dermatologie' },
      ];
      svc.findAll.mockResolvedValue(expected);

      const result = await controller.findAll({
        q: 'car',
        page: '2',
        limit: '5',
      } as any);

      expect(svc.findAll).toHaveBeenCalledWith({
        q: 'car',
        page: 2,
        limit: 5,
      });
      expect(result).toEqual(expected);
    });

    it('should default page and limit to 1 and 10 when invalid', async () => {
      svc.findAll.mockResolvedValue([]);

      await controller.findAll({} as any);

      expect(svc.findAll).toHaveBeenCalledWith({ page: 1, limit: 10 });
    });
  });

  describe('findOne', () => {
    it('should delegate to findOne with the id', async () => {
      svc.findOne.mockResolvedValue(speciality);

      const result = await controller.findOne(1);

      expect(svc.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual(speciality);
    });
  });
});
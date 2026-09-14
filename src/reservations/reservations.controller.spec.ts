import { Test, TestingModule } from '@nestjs/testing';
import { ReservationsController } from './reservations.controller';
import { ReservationsService } from './reservations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ActiveAndVerifiedGuard } from '../auth/guards/active-verified.guard';

describe('ReservationsController', () => {
  let controller: ReservationsController;
  let svc: Record<string, jest.Mock>;

  beforeEach(async () => {
    svc = { create: jest.fn(), startConsultation: jest.fn(), completeConsultation: jest.fn(), updateDate: jest.fn(), findOne: jest.fn(), findAll: jest.fn(), rateDoctor: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReservationsController],
      providers: [
        { provide: ReservationsService, useValue: svc },
      ],
    })
      .overrideGuard(JwtAuthGuard).useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(ActiveAndVerifiedGuard).useValue({ canActivate: jest.fn(() => true) })
      .compile();
    controller = module.get(ReservationsController);
  });

  it('should delegate create', async () => {
    svc.create.mockResolvedValue({ reservation: {} });
    await controller.create({} as any);
    expect(svc.create).toHaveBeenCalled();
  });
  it('should delegate start', async () => {
    svc.startConsultation.mockResolvedValue({ success: true });
    await controller.start(1, { user: { userId: 2 } });
    expect(svc.startConsultation).toHaveBeenCalledWith(1, 2);
  });
  it('should delegate complete', async () => {
    svc.completeConsultation.mockResolvedValue({ success: true });
    await controller.complete(1, { user: { userId: 2 } });
    expect(svc.completeConsultation).toHaveBeenCalledWith(1, 2);
  });
  it('should delegate updateDate', async () => {
    svc.updateDate.mockResolvedValue({ reservation: {} });
    await controller.updateDate(1, {} as any);
    expect(svc.updateDate).toHaveBeenCalledWith(1, {} as any);
  });
  it('should delegate findOne', async () => {
    svc.findOne.mockResolvedValue({ data: {} });
    await controller.findOne(1);
    expect(svc.findOne).toHaveBeenCalledWith(1);
  });
  it('should delegate findAll', async () => {
    svc.findAll.mockResolvedValue({ data: [] });
    await controller.findAll({});
    expect(svc.findAll).toHaveBeenCalled();
  });
  it('should delegate rate', async () => {
    svc.rateDoctor.mockResolvedValue({ rating: {} });
    await controller.rate(1, {} as any);
    expect(svc.rateDoctor).toHaveBeenCalledWith(1, {} as any);
  });
});
import { Test, TestingModule } from '@nestjs/testing';
import { PlanningsController } from './plannings.controller';
import { PlanningsService } from './plannings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ActiveAndVerifiedGuard } from '../auth/guards/active-verified.guard';

describe('PlanningsController', () => {
  let controller: PlanningsController;
  let svc: Record<string, jest.Mock>;

  beforeEach(async () => {
    svc = { createOrUpdate: jest.fn(), updateJourStatus: jest.fn(), findByMedecin: jest.fn(), getSlots: jest.fn(), removeAll: jest.fn(), removeSlot: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PlanningsController],
      providers: [
        { provide: PlanningsService, useValue: svc },
      ],
    })
      .overrideGuard(JwtAuthGuard).useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(ActiveAndVerifiedGuard).useValue({ canActivate: jest.fn(() => true) })
      .compile();
    controller = module.get(PlanningsController);
  });

  it('should delegate createOrUpdate', async () => {
    svc.createOrUpdate.mockResolvedValue({ message: 'ok' });
    await controller.createOrUpdate({ medecinId: 1, plannings: [] } as any);
    expect(svc.createOrUpdate).toHaveBeenCalled();
  });
  it('should delegate updateJourStatus', async () => {
    svc.updateJourStatus.mockResolvedValue({ message: 'ok' });
    await controller.updateJourStatus(1, { jour: 'lundi', isOff: true } as any);
    expect(svc.updateJourStatus).toHaveBeenCalledWith(1, { jour: 'lundi', isOff: true });
  });
  it('should delegate findByMedecin', async () => {
    svc.findByMedecin.mockResolvedValue({ plannings: {} });
    await controller.findByMedecin(1);
    expect(svc.findByMedecin).toHaveBeenCalledWith(1);
  });
  it('should delegate getSlots', async () => {
    svc.getSlots.mockResolvedValue({ slots: [] });
    await controller.getSlots({} as any);
    expect(svc.getSlots).toHaveBeenCalled();
  });
  it('should delegate removeAll', async () => {
    svc.removeAll.mockResolvedValue({ count: 0 });
    await controller.removeAll(1);
    expect(svc.removeAll).toHaveBeenCalledWith(1);
  });
  it('should delegate removeSlot', async () => {
    svc.removeSlot.mockResolvedValue({ planningId: 1 });
    await controller.removeSlot(1);
    expect(svc.removeSlot).toHaveBeenCalledWith(1);
  });
});

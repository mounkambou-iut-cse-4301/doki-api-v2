import { Test, TestingModule } from '@nestjs/testing';
import { FormationsController } from './formations.controller';
import { FormationsService } from './formations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ActiveAndVerifiedGuard } from '../auth/guards/active-verified.guard';

describe('FormationsController', () => {
  let controller: FormationsController;
  let svc: Record<string, jest.Mock>;

  beforeEach(async () => {
    svc = { findAll: jest.fn(), findOne: jest.fn(), create: jest.fn(), update: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FormationsController],
      providers: [
        { provide: FormationsService, useValue: svc },
      ],
    })
      .overrideGuard(JwtAuthGuard).useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(ActiveAndVerifiedGuard).useValue({ canActivate: jest.fn(() => true) })
      .compile();
    controller = module.get(FormationsController);
  });

  it('should delegate findAll', async () => {
    svc.findAll.mockResolvedValue({ data: [] });
    await controller.findAll({});
    expect(svc.findAll).toHaveBeenCalled();
  });
  it('should delegate findOne', async () => {
    svc.findOne.mockResolvedValue({ formationId: 1 });
    await controller.findOne(1);
    expect(svc.findOne).toHaveBeenCalledWith(1, true);
  });
  it('should delegate create', async () => {
    svc.create.mockResolvedValue({ formationId: 1 });
    await controller.create({} as any);
    expect(svc.create).toHaveBeenCalled();
  });
  it('should delegate update', async () => {
    svc.update.mockResolvedValue({ formationId: 1 });
    await controller.update(1, {} as any);
    expect(svc.update).toHaveBeenCalledWith(1, {} as any);
  });
});

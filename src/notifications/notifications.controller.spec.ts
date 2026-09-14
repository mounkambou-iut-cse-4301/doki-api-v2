import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ActiveAndVerifiedGuard } from '../auth/guards/active-verified.guard';

describe('NotificationsController', () => {
  let controller: NotificationsController;
  let svc: Record<string, jest.Mock>;

  beforeEach(async () => {
    svc = { saveExpoToken: jest.fn(), create: jest.fn(), findAll: jest.fn(), markAsRead: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [
        { provide: NotificationsService, useValue: svc },
      ],
    })
      .overrideGuard(JwtAuthGuard).useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(ActiveAndVerifiedGuard).useValue({ canActivate: jest.fn(() => true) })
      .compile();
    controller = module.get(NotificationsController);
  });

  it('should delegate saveExpoToken', async () => {
    svc.saveExpoToken.mockResolvedValue({ messageE: 'saved' });
    await controller.saveExpoToken({} as any);
    expect(svc.saveExpoToken).toHaveBeenCalled();
  });
  it('should delegate create', async () => {
    svc.create.mockResolvedValue({ notification: {} });
    await controller.create({} as any);
    expect(svc.create).toHaveBeenCalled();
  });
  it('should delegate findAll', async () => {
    svc.findAll.mockResolvedValue({ items: [] });
    await controller.findAll({});
    expect(svc.findAll).toHaveBeenCalled();
  });
  it('should delegate markAsRead', async () => {
    svc.markAsRead.mockResolvedValue({ data: {} });
    await controller.markAsRead('1');
    expect(svc.markAsRead).toHaveBeenCalledWith(1);
  });
});

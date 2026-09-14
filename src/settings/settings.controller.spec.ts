import { Test, TestingModule } from '@nestjs/testing';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ActiveAndVerifiedGuard } from '../auth/guards/active-verified.guard';

describe('SettingsController', () => {
  let controller: SettingsController;
  let svc: Record<string, jest.Mock>;

  beforeEach(async () => {
    svc = { createOrUpdate: jest.fn(), getSettings: jest.fn(), updateSettings: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SettingsController],
      providers: [
        { provide: SettingsService, useValue: svc },
      ],
    })
      .overrideGuard(JwtAuthGuard).useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(ActiveAndVerifiedGuard).useValue({ canActivate: jest.fn(() => true) })
      .compile();
    controller = module.get(SettingsController);
  });

  it('should delegate createOrUpdate', async () => {
    svc.createOrUpdate.mockResolvedValue({ data: {} });
    await controller.createOrUpdate({ onlineValue: 10 }, { user: { userId: 1 } });
    expect(svc.createOrUpdate).toHaveBeenCalled();
  });

  it('should delegate getSettings', async () => {
    svc.getSettings.mockResolvedValue({ data: {} });
    await controller.getSettings();
    expect(svc.getSettings).toHaveBeenCalled();
  });

  it('should delegate updateSettings', async () => {
    svc.updateSettings.mockResolvedValue({ data: {} });
    await controller.updateSettings({ onlineValue: 15 }, { user: { userId: 1 } });
    expect(svc.updateSettings).toHaveBeenCalled();
  });
});

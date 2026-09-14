import { Test, TestingModule } from '@nestjs/testing';
import { AdminsController } from './admins.controller';
import { AdminsService } from './admins.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ActiveAndVerifiedGuard } from '../auth/guards/active-verified.guard';

describe('AdminsController', () => {
  let controller: AdminsController;
  let svc: Record<string, jest.Mock>;

  beforeEach(async () => {
    svc = { overview: jest.fn(), topDoctors: jest.fn(), revenueLast5Months: jest.fn(), verifyUser: jest.fn(), toggleBlockUser: jest.fn(), listTransactions: jest.fn(), getTransactionDetail: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminsController],
      providers: [
        { provide: AdminsService, useValue: svc },
      ],
    })
      .overrideGuard(JwtAuthGuard).useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(ActiveAndVerifiedGuard).useValue({ canActivate: jest.fn(() => true) })
      .compile();
    controller = module.get(AdminsController);
  });

  it('should delegate overview', async () => {
    svc.overview.mockResolvedValue({ totalDoctors: 10 });
    await controller.overview();
    expect(svc.overview).toHaveBeenCalled();
  });
  it('should delegate topDoctors', async () => {
    svc.topDoctors.mockResolvedValue([]);
    await controller.topDoctors();
    expect(svc.topDoctors).toHaveBeenCalled();
  });
  it('should delegate revenueLast5Months', async () => {
    svc.revenueLast5Months.mockResolvedValue([]);
    await controller.revenueLast5Months();
    expect(svc.revenueLast5Months).toHaveBeenCalled();
  });
  it('should delegate verifyUser', async () => {
    svc.verifyUser.mockResolvedValue({});
    await controller.verifyUser(1);
    expect(svc.verifyUser).toHaveBeenCalledWith(1);
  });
  it('should delegate toggleBlockUser', async () => {
    svc.toggleBlockUser.mockResolvedValue({});
    await controller.toggleBlockUser(1);
    expect(svc.toggleBlockUser).toHaveBeenCalledWith(1);
  });
  it('should delegate listTransactions', async () => {
    svc.listTransactions.mockResolvedValue({ items: [] });
    await controller.listTransactions({});
    expect(svc.listTransactions).toHaveBeenCalled();
  });
  it('should delegate getTransaction', async () => {
    svc.getTransactionDetail.mockResolvedValue({});
    await controller.getTransaction(1);
    expect(svc.getTransactionDetail).toHaveBeenCalledWith(1);
  });
});

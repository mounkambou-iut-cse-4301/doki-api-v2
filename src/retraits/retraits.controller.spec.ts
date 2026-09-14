import { Test, TestingModule } from '@nestjs/testing';
import { RetraitsController } from './retraits.controller';
import { RetraitsService } from './retraits.service';

describe('RetraitsController', () => {
  let controller: RetraitsController;
  let svc: Record<string, jest.Mock>;

  beforeEach(async () => {
    svc = { createParametre: jest.fn(), verifyParametreOtp: jest.fn(), updateParametre: jest.fn(), getParametreByUserId: jest.fn(), getSoldeUser: jest.fn(), demanderRetrait: jest.fn(), verifyRetraitOtp: jest.fn(), getMesRetraits: jest.fn(), getAllRetraitsAdmin: jest.fn(), completeRetrait: jest.fn(), cancelRetrait: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RetraitsController],
      providers: [{ provide: RetraitsService, useValue: svc }],
    }).compile();
    controller = module.get(RetraitsController);
  });

  it('should delegate createParametre', async () => {
    svc.createParametre.mockResolvedValue({ data: {} });
    await controller.createParametre({} as any);
    expect(svc.createParametre).toHaveBeenCalled();
  });
  it('should delegate verifyParametreOtp', async () => {
    svc.verifyParametreOtp.mockResolvedValue({ data: {} });
    await controller.verifyParametreOtp(1, {} as any);
    expect(svc.verifyParametreOtp).toHaveBeenCalledWith(1, {} as any);
  });
  it('should delegate updateParametre', async () => {
    svc.updateParametre.mockResolvedValue({ data: {} });
    await controller.updateParametre(1, {} as any);
    expect(svc.updateParametre).toHaveBeenCalledWith(1, {} as any);
  });
  it('should delegate getParametre', async () => {
    svc.getParametreByUserId.mockResolvedValue({ data: {} });
    await controller.getParametre(1);
    expect(svc.getParametreByUserId).toHaveBeenCalledWith(1);
  });
  it('should delegate getSolde', async () => {
    svc.getSoldeUser.mockResolvedValue({ data: {} });
    await controller.getSolde(1);
    expect(svc.getSoldeUser).toHaveBeenCalledWith(1);
  });
  it('should delegate demanderRetrait', async () => {
    svc.demanderRetrait.mockResolvedValue({ data: {} });
    await controller.demanderRetrait({} as any);
    expect(svc.demanderRetrait).toHaveBeenCalled();
  });
  it('should delegate verifyRetraitOtp', async () => {
    svc.verifyRetraitOtp.mockResolvedValue({ data: {} });
    await controller.verifyRetraitOtp(1, {} as any);
    expect(svc.verifyRetraitOtp).toHaveBeenCalledWith(1, {} as any);
  });
  it('should delegate getMesRetraits', async () => {
    svc.getMesRetraits.mockResolvedValue({ data: [] });
    await controller.getMesRetraits({});
    expect(svc.getMesRetraits).toHaveBeenCalled();
  });
  it('should delegate getAllRetraitsAdmin', async () => {
    svc.getAllRetraitsAdmin.mockResolvedValue({ data: [] });
    await controller.getAllRetraitsAdmin({});
    expect(svc.getAllRetraitsAdmin).toHaveBeenCalled();
  });
  it('should delegate completeRetrait', async () => {
    svc.completeRetrait.mockResolvedValue({ message: 'ok' });
    await controller.completeRetrait(1, {} as any);
    expect(svc.completeRetrait).toHaveBeenCalledWith(1, {} as any);
  });
  it('should delegate cancelRetrait', async () => {
    svc.cancelRetrait.mockResolvedValue({ message: 'ok' });
    await controller.cancelRetrait(1, {} as any);
    expect(svc.cancelRetrait).toHaveBeenCalledWith(1, {} as any);
  });
});
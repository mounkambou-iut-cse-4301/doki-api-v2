import { Test, TestingModule } from '@nestjs/testing';
import { PublicitesController } from './publicites.controller';
import { PublicitesService } from './publicites.service';

describe('PublicitesController', () => {
  let controller: PublicitesController;
  let svc: Record<string, jest.Mock>;

  beforeEach(async () => {
    svc = { createPackage: jest.fn(), updatePackage: jest.fn(), getAllPackages: jest.fn(), getOnePackage: jest.fn(), createPublicite: jest.fn(), findAllAdmin: jest.fn(), findAll: jest.fn(), findOne: jest.fn(), update: jest.fn(), cancel: jest.fn(), terminate: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PublicitesController],
      providers: [{ provide: PublicitesService, useValue: svc }],
    }).compile();
    controller = module.get(PublicitesController);
  });

  it('should delegate createPackage', async () => {
    svc.createPackage.mockResolvedValue({ data: {} });
    await controller.createPackage({} as any);
    expect(svc.createPackage).toHaveBeenCalled();
  });
  it('should delegate updatePackage', async () => {
    svc.updatePackage.mockResolvedValue({ data: {} });
    await controller.updatePackage(1, {} as any);
    expect(svc.updatePackage).toHaveBeenCalledWith(1, {} as any);
  });
  it('should delegate getAllPackages', async () => {
    svc.getAllPackages.mockResolvedValue({ data: [] });
    await controller.getAllPackages({});
    expect(svc.getAllPackages).toHaveBeenCalled();
  });
  it('should delegate getOnePackage', async () => {
    svc.getOnePackage.mockResolvedValue({ data: {} });
    await controller.getOnePackage(1);
    expect(svc.getOnePackage).toHaveBeenCalledWith(1);
  });
  it('should delegate createPublicite', async () => {
    svc.createPublicite.mockResolvedValue({ data: {} });
    await controller.createPublicite({} as any);
    expect(svc.createPublicite).toHaveBeenCalled();
  });
  it('should delegate findAllAdmin', async () => {
    svc.findAllAdmin.mockResolvedValue({ data: [] });
    await controller.findAllAdmin({});
    expect(svc.findAllAdmin).toHaveBeenCalled();
  });
  it('should delegate findAll', async () => {
    svc.findAll.mockResolvedValue({ data: [] });
    await controller.findAll({});
    expect(svc.findAll).toHaveBeenCalled();
  });
  it('should delegate findOne', async () => {
    svc.findOne.mockResolvedValue({ data: {} });
    await controller.findOne(1);
    expect(svc.findOne).toHaveBeenCalledWith(1);
  });
  it('should delegate update', async () => {
    svc.update.mockResolvedValue({ data: {} });
    await controller.update(1, {} as any);
    expect(svc.update).toHaveBeenCalledWith(1, {} as any);
  });
  it('should delegate cancel', async () => {
    svc.cancel.mockResolvedValue({ message: 'ok' });
    await controller.cancel(1);
    expect(svc.cancel).toHaveBeenCalledWith(1);
  });
  it('should delegate terminate', async () => {
    svc.terminate.mockResolvedValue({ data: {} });
    await controller.terminate(1);
    expect(svc.terminate).toHaveBeenCalledWith(1);
  });
});

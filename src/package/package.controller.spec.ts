import { Test, TestingModule } from '@nestjs/testing';
import { PackageController } from './package.controller';
import { PackageService } from './package.service';

describe('PackageController', () => {
  let controller: PackageController;
  let svc: Record<string, jest.Mock>;

  beforeEach(async () => {
    svc = { create: jest.fn(), findAll: jest.fn(), findOne: jest.fn(), update: jest.fn(), remove: jest.fn(), activate: jest.fn(), deactivate: jest.fn(), getBySpeciality: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PackageController],
      providers: [{ provide: PackageService, useValue: svc }],
    }).compile();
    controller = module.get(PackageController);
  });

  it('should delegate create', async () => {
    svc.create.mockResolvedValue({ data: {} });
    await controller.create({} as any);
    expect(svc.create).toHaveBeenCalled();
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
  it('should delegate remove', async () => {
    svc.remove.mockResolvedValue({ message: 'ok' });
    await controller.remove(1);
    expect(svc.remove).toHaveBeenCalledWith(1);
  });
  it('should delegate activate', async () => {
    svc.activate.mockResolvedValue({ data: {} });
    await controller.activate(1);
    expect(svc.activate).toHaveBeenCalledWith(1);
  });
  it('should delegate deactivate', async () => {
    svc.deactivate.mockResolvedValue({ data: {} });
    await controller.deactivate(1);
    expect(svc.deactivate).toHaveBeenCalledWith(1);
  });
  it('should delegate getBySpeciality', async () => {
    svc.getBySpeciality.mockResolvedValue({ data: [] });
    await controller.getBySpeciality(1, true);
    expect(svc.getBySpeciality).toHaveBeenCalledWith(1, true);
  });
});

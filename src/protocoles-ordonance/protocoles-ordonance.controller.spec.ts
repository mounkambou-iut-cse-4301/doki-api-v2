import { Test, TestingModule } from '@nestjs/testing';
import { ProtocolesOrdonanceController } from './protocoles-ordonance.controller';
import { ProtocolesOrdonanceService } from './protocoles-ordonance.service';

describe('ProtocolesOrdonanceController', () => {
  let controller: ProtocolesOrdonanceController;
  let svc: Record<string, jest.Mock>;

  beforeEach(async () => {
    svc = { create: jest.fn(), update: jest.fn(), findOne: jest.fn(), findAll: jest.fn(), createMedicament: jest.fn(), updateMedicament: jest.fn(), deleteMedicament: jest.fn(), findOneMedicament: jest.fn(), findAllMedicaments: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProtocolesOrdonanceController],
      providers: [{ provide: ProtocolesOrdonanceService, useValue: svc }],
    }).compile();
    controller = module.get(ProtocolesOrdonanceController);
  });

  it('should delegate create', async () => {
    svc.create.mockResolvedValue({ item: {} });
    await controller.create({} as any);
    expect(svc.create).toHaveBeenCalled();
  });
  it('should delegate update', async () => {
    svc.update.mockResolvedValue({ item: {} });
    await controller.update(1, {} as any);
    expect(svc.update).toHaveBeenCalledWith(1, {} as any);
  });
  it('should delegate findOne', async () => {
    svc.findOne.mockResolvedValue({ item: {} });
    await controller.findOne(1);
    expect(svc.findOne).toHaveBeenCalledWith(1);
  });
  it('should delegate findAll', async () => {
    svc.findAll.mockResolvedValue({ items: [] });
    await controller.findAll({});
    expect(svc.findAll).toHaveBeenCalled();
  });
  it('should delegate createMedicament', async () => {
    svc.createMedicament.mockResolvedValue({ item: {} });
    await controller.createMedicament({} as any);
    expect(svc.createMedicament).toHaveBeenCalled();
  });
  it('should delegate updateMedicament', async () => {
    svc.updateMedicament.mockResolvedValue({ item: {} });
    await controller.updateMedicament(1, {} as any);
    expect(svc.updateMedicament).toHaveBeenCalledWith(1, {} as any);
  });
  it('should delegate deleteMedicament', async () => {
    svc.deleteMedicament.mockResolvedValue({ message: 'ok' });
    await controller.deleteMedicament(1);
    expect(svc.deleteMedicament).toHaveBeenCalledWith(1);
  });
  it('should delegate findOneMedicament', async () => {
    svc.findOneMedicament.mockResolvedValue({ item: {} });
    await controller.findOneMedicament(1);
    expect(svc.findOneMedicament).toHaveBeenCalledWith(1);
  });
  it('should delegate findAllMedicaments', async () => {
    svc.findAllMedicaments.mockResolvedValue({ items: [] });
    await controller.findAllMedicaments({});
    expect(svc.findAllMedicaments).toHaveBeenCalled();
  });
});

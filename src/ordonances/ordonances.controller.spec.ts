import { Test, TestingModule } from '@nestjs/testing';
import { OrdonancesController } from './ordonances.controller';
import { OrdonancesService } from './ordonances.service';

describe('OrdonancesController', () => {
  let controller: OrdonancesController;
  let svc: Record<string, jest.Mock>;

  beforeEach(async () => {
    svc = { create: jest.fn(), update: jest.fn(), findAll: jest.fn(), findOne: jest.fn(), remove: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrdonancesController],
      providers: [{ provide: OrdonancesService, useValue: svc }],
    }).compile();
    controller = module.get(OrdonancesController);
  });

  it('should delegate create', async () => {
    svc.create.mockResolvedValue({ ordonanceId: 1 });
    await controller.create({} as any);
    expect(svc.create).toHaveBeenCalled();
  });
  it('should delegate findAll', async () => {
    svc.findAll.mockResolvedValue({ items: [], meta: {} });
    await controller.findAll({});
    expect(svc.findAll).toHaveBeenCalled();
  });
  it('should delegate findOne', async () => {
    svc.findOne.mockResolvedValue({ ordonanceId: 1 });
    await controller.findOne(1);
    expect(svc.findOne).toHaveBeenCalledWith(1);
  });
  it('should delegate update', async () => {
    svc.update.mockResolvedValue({ ordonanceId: 1 });
    await controller.update(1, {} as any);
    expect(svc.update).toHaveBeenCalledWith(1, {} as any);
  });
  it('should delegate remove', async () => {
    svc.remove.mockResolvedValue({ messageE: 'deleted' });
    await controller.remove(1);
    expect(svc.remove).toHaveBeenCalledWith(1);
  });
});

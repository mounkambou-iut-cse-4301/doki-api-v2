import { Test, TestingModule } from '@nestjs/testing';
import { SuivisController } from './suivis.controller';
import { SuivisService } from './suivis.service';

describe('SuivisController', () => {
  let controller: SuivisController;
  let svc: Record<string, jest.Mock>;

  beforeEach(async () => {
    svc = { findAll: jest.fn(), findOne: jest.fn(), create: jest.fn(), update: jest.fn(), remove: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SuivisController],
      providers: [{ provide: SuivisService, useValue: svc }],
    }).compile();
    controller = module.get(SuivisController);
  });

  it('should delegate findAll', async () => {
    svc.findAll.mockResolvedValue({ items: [] });
    await controller.findAll({});
    expect(svc.findAll).toHaveBeenCalled();
  });
  it('should delegate findOne', async () => {
    svc.findOne.mockResolvedValue({ item: {} });
    await controller.findOne(1);
    expect(svc.findOne).toHaveBeenCalledWith(1);
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
  it('should delegate remove', async () => {
    svc.remove.mockResolvedValue({ messageE: 'deleted' });
    await controller.remove(1);
    expect(svc.remove).toHaveBeenCalledWith(1);
  });
});

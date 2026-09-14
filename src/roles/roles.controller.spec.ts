import { Test, TestingModule } from '@nestjs/testing';
import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';

describe('RolesController', () => {
  let controller: RolesController;
  let svc: Record<string, jest.Mock>;

  beforeEach(async () => {
    svc = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RolesController],
      providers: [{ provide: RolesService, useValue: svc }],
    }).compile();

    controller = module.get(RolesController);
  });

  it('should delegate create to service', async () => {
    svc.create.mockResolvedValue({ roleId: 1 });
    const result = await controller.create({ name: 'test' });
    expect(result).toEqual({ roleId: 1 });
    expect(svc.create).toHaveBeenCalledWith({ name: 'test' });
  });

  it('should delegate findAll to service', async () => {
    svc.findAll.mockResolvedValue([]);
    await controller.findAll();
    expect(svc.findAll).toHaveBeenCalled();
  });

  it('should delegate findOne to service', async () => {
    svc.findOne.mockResolvedValue({ roleId: 1 });
    await controller.findOne(1);
    expect(svc.findOne).toHaveBeenCalledWith(1);
  });

  it('should delegate update to service', async () => {
    svc.update.mockResolvedValue({ roleId: 1 });
    await controller.update(1, { name: 'new' });
    expect(svc.update).toHaveBeenCalledWith(1, { name: 'new' });
  });

  it('should delegate remove to service', async () => {
    svc.remove.mockResolvedValue({ roleId: 1 });
    await controller.remove(1);
    expect(svc.remove).toHaveBeenCalledWith(1);
  });
});

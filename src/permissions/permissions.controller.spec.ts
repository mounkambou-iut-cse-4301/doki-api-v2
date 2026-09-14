import { Test, TestingModule } from '@nestjs/testing';
import { PermissionsController } from './permissions.controller';
import { PermissionsService } from './permissions.service';

describe('PermissionsController', () => {
  let controller: PermissionsController;
  let svc: Record<string, jest.Mock>;

  beforeEach(async () => {
    svc = { findAll: jest.fn(), findOne: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PermissionsController],
      providers: [{ provide: PermissionsService, useValue: svc }],
    }).compile();
    controller = module.get(PermissionsController);
  });

  it('should delegate findAll to service', async () => {
    svc.findAll.mockResolvedValue({ data: [], meta: { total: 0 } });
    const result = await controller.findAll({});
    expect(result).toEqual({ data: [], meta: { total: 0 } });
  });
});

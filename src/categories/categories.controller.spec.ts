import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';

describe('CategoriesController', () => {
  let controller: CategoriesController;
  let svc: Record<string, jest.Mock>;

  beforeEach(async () => {
    svc = { findAll: jest.fn(), findOne: jest.fn(), create: jest.fn(), update: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoriesController],
      providers: [{ provide: CategoriesService, useValue: svc }],
    }).compile();
    controller = module.get(CategoriesController);
  });

  it('should delegate findAll', async () => {
    svc.findAll.mockResolvedValue({ data: [], meta: {} });
    await controller.findAll({});
    expect(svc.findAll).toHaveBeenCalled();
  });

  it('should delegate findOne', async () => {
    svc.findOne.mockResolvedValue({ categoryId: 1 });
    await controller.findOne(1);
    expect(svc.findOne).toHaveBeenCalledWith(1);
  });

  it('should delegate create', async () => {
    svc.create.mockResolvedValue({ categoryId: 1 });
    await controller.create({ name: 'X' });
    expect(svc.create).toHaveBeenCalled();
  });

  it('should delegate update', async () => {
    svc.update.mockResolvedValue({ categoryId: 1 });
    await controller.update(1, { name: 'X' });
    expect(svc.update).toHaveBeenCalledWith(1, { name: 'X' });
  });
});

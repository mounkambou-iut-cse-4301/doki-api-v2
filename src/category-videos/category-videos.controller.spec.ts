import { Test, TestingModule } from '@nestjs/testing';
import { CategoryVideosController } from './category-videos.controller';
import { CategoryVideosService } from './category-videos.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ActiveAndVerifiedGuard } from '../auth/guards/active-verified.guard';

describe('CategoryVideosController', () => {
  let controller: CategoryVideosController;
  let svc: Record<string, jest.Mock>;

  beforeEach(async () => {
    svc = { create: jest.fn(), update: jest.fn(), findAll: jest.fn(), findOne: jest.fn(), remove: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoryVideosController],
      providers: [
        { provide: CategoryVideosService, useValue: svc },
      ],
    })
      .overrideGuard(JwtAuthGuard).useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(ActiveAndVerifiedGuard).useValue({ canActivate: jest.fn(() => true) })
      .compile();
    controller = module.get(CategoryVideosController);
  });

  it('should delegate create', async () => {
    svc.create.mockResolvedValue({ item: {} });
    await controller.create({} as any);
    expect(svc.create).toHaveBeenCalled();
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

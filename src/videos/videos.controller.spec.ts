import { Test, TestingModule } from '@nestjs/testing';
import { VideosController } from './videos.controller';
import { VideosService } from './videos.service';

describe('VideosController', () => {
  let controller: VideosController;
  let svc: Record<string, jest.Mock>;

  beforeEach(async () => {
    svc = { create: jest.fn(), update: jest.fn(), findAll: jest.fn(), findOne: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VideosController],
      providers: [{ provide: VideosService, useValue: svc }],
    }).compile();
    controller = module.get(VideosController);
  });

  it('should delegate create', async () => {
    svc.create.mockResolvedValue({ video: {} });
    await controller.create({} as any);
    expect(svc.create).toHaveBeenCalled();
  });
  it('should delegate findAll', async () => {
    svc.findAll.mockResolvedValue({ items: [] });
    await controller.findAll({});
    expect(svc.findAll).toHaveBeenCalled();
  });
  it('should delegate findOne', async () => {
    svc.findOne.mockResolvedValue({ video: {} });
    await controller.findOne(1);
    expect(svc.findOne).toHaveBeenCalledWith(1);
  });
  it('should delegate update', async () => {
    svc.update.mockResolvedValue({ video: {} });
    await controller.update(1, {} as any);
    expect(svc.update).toHaveBeenCalledWith(1, {} as any);
  });
});

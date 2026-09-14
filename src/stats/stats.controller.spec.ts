import { Test, TestingModule } from '@nestjs/testing';
import { StatsController } from './stats.controller';
import { StatsService } from './stats.service';

describe('StatsController', () => {
  let controller: StatsController;
  let svc: Record<string, jest.Mock>;

  beforeEach(async () => {
    svc = { medecinStats: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StatsController],
      providers: [{ provide: StatsService, useValue: svc }],
    }).compile();
    controller = module.get(StatsController);
  });

  it('should delegate getMedecinStats', async () => {
    svc.medecinStats.mockResolvedValue({ medecinId: 1, abonnés: 0, revenue: 0 });
    await controller.getMedecinStats(1);
    expect(svc.medecinStats).toHaveBeenCalledWith(1);
  });
});

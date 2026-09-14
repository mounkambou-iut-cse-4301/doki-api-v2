import { Test, TestingModule } from '@nestjs/testing';
import { CasDifficilesController } from './cas-difficiles.controller';
import { CasDifficilesService } from './cas-difficiles.service';

describe('CasDifficilesController', () => {
  let controller: CasDifficilesController;
  let svc: Record<string, jest.Mock>;

  beforeEach(async () => {
    svc = { createCas: jest.fn(), listCas: jest.fn(), sendCasMessage: jest.fn(), listCasMessages: jest.fn(), markCasRead: jest.fn(), casUnreadCount: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CasDifficilesController],
      providers: [{ provide: CasDifficilesService, useValue: svc }],
    }).compile();
    controller = module.get(CasDifficilesController);
  });

  it('should delegate create', async () => {
    svc.createCas.mockResolvedValue({ casDifficileId: 1 });
    await controller.create({} as any);
    expect(svc.createCas).toHaveBeenCalled();
  });
  it('should delegate list', async () => {
    svc.listCas.mockResolvedValue({ items: [] });
    await controller.list({});
    expect(svc.listCas).toHaveBeenCalled();
  });
  it('should delegate sendMessage', async () => {
    svc.sendCasMessage.mockResolvedValue({ id: 1 });
    await controller.sendMessage('1', {} as any);
    expect(svc.sendCasMessage).toHaveBeenCalledWith(1, {} as any);
  });
  it('should delegate listMessages', async () => {
    svc.listCasMessages.mockResolvedValue({ items: [] });
    await controller.listMessages('1', {} as any);
    expect(svc.listCasMessages).toHaveBeenCalledWith(1, {} as any);
  });
  it('should delegate markRead', async () => {
    svc.markCasRead.mockResolvedValue({});
    await controller.markRead('1', { readerId: 1 } as any);
    expect(svc.markCasRead).toHaveBeenCalledWith(1, 1);
  });
  it('should delegate unreadCount', async () => {
    svc.casUnreadCount.mockResolvedValue(0);
    await controller.unreadCount('1', '2');
    expect(svc.casUnreadCount).toHaveBeenCalledWith(1, 2);
  });
});

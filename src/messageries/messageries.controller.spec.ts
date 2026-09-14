import { Test, TestingModule } from '@nestjs/testing';
import { MessageriesController } from './messageries.controller';
import { MessageriesService } from './messageries.service';

describe('MessageriesController', () => {
  let controller: MessageriesController;
  let svc: Record<string, jest.Mock>;

  beforeEach(async () => {
    svc = { sendDmMessage: jest.fn(), listConversations: jest.fn(), listMessages: jest.fn(), markConversationRead: jest.fn(), getConversationAndMarkRead: jest.fn(), getUnreadOverview: jest.fn(), sendFicheRequest: jest.fn(), submitFicheResponse: jest.fn(), listFicheResponsesByConversation: jest.fn(), getFicheQuestionsAndResponses: jest.fn(), generateConversationMistidracsGemini: jest.fn(), generateConversationSummaryMistidracs: jest.fn(), explainFicheQuestion: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MessageriesController],
      providers: [{ provide: MessageriesService, useValue: svc }],
    }).compile();
    controller = module.get(MessageriesController);
  });

  it('should delegate send', async () => {
    svc.sendDmMessage.mockResolvedValue({ id: 1 });
    await controller.send({ senderId: 1 } as any);
    expect(svc.sendDmMessage).toHaveBeenCalled();
  });
  it('should delegate listConversations', async () => {
    svc.listConversations.mockResolvedValue({ items: [] });
    await controller.listConversations({});
    expect(svc.listConversations).toHaveBeenCalled();
  });
  it('should delegate listMessages', async () => {
    svc.listMessages.mockResolvedValue({ items: [] });
    await controller.listMessages('1', {} as any);
    expect(svc.listMessages).toHaveBeenCalledWith(1, {} as any);
  });
  it('should delegate markRead', async () => {
    svc.markConversationRead.mockResolvedValue({});
    await controller.markRead('1', { readerId: 1 } as any);
    expect(svc.markConversationRead).toHaveBeenCalledWith(1, 1);
  });
  it('should delegate getConversation', async () => {
    svc.getConversationAndMarkRead.mockResolvedValue({ messages: [] });
    await controller.getConversation('1', {} as any);
    expect(svc.getConversationAndMarkRead).toHaveBeenCalledWith(1, {} as any);
  });
  it('should delegate unreadOverview', async () => {
    svc.getUnreadOverview.mockResolvedValue({ totalUnread: 0 });
    await controller.unreadOverview('1');
    expect(svc.getUnreadOverview).toHaveBeenCalledWith(1);
  });
  it('should delegate explainQuestion', async () => {
    svc.explainFicheQuestion.mockResolvedValue({ explanation: 'test' });
    await controller.explainQuestion({ ficheId: 1, questionId: 'q1', provider: 'openai' } as any);
    expect(svc.explainFicheQuestion).toHaveBeenCalled();
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { MessageriesService } from './messageries.service';
import { PrismaService } from '../prisma/prisma.service';
import { OpenaiService } from '../ai/ai.service';
import { GeminiService } from '../ai/gemini/gemini.service';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';

jest.mock('src/utils/expo-push', () => ({ bi: (s: string) => s, sendExpoPush: jest.fn(), isValidExpoToken: () => false }));
jest.mock('src/ai/explain-question.prompt', () => ({ buildExplainQuestionPrompt: jest.fn().mockReturnValue('prompt') }));

describe('MessageriesService', () => {
  let service: MessageriesService;
  let prisma: Record<string, any>;
  let openai: Record<string, jest.Mock>;
  let gemini: Record<string, jest.Mock>;

  beforeEach(async () => {
    prisma = {
      user: { findUnique: jest.fn() },
      conversation: { findFirst: jest.fn(), findUnique: jest.fn(), findMany: jest.fn(), count: jest.fn(), create: jest.fn(), update: jest.fn() },
      message: { findMany: jest.fn(), create: jest.fn(), count: jest.fn(), updateMany: jest.fn() },
      fiche: { findUnique: jest.fn() },
      conversationFicheRequest: { create: jest.fn() },
      conversationFicheResponse: { create: jest.fn(), findMany: jest.fn() },
      notification: { create: jest.fn() },
      $transaction: jest.fn((fns: any[]) => Promise.all(fns)),
    };
    openai = { chat: jest.fn().mockResolvedValue('AI answer') };
    gemini = { generateContent: jest.fn().mockResolvedValue('Gemini answer') };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessageriesService,
        { provide: PrismaService, useValue: prisma },
        { provide: OpenaiService, useValue: openai },
        { provide: GeminiService, useValue: gemini },
      ],
    }).compile();

    service = module.get(MessageriesService);
  });

  describe('sendDmMessage', () => {
    it('should throw if sender not part of conversation', async () => {
      await expect(service.sendDmMessage(999, { medecinId: 1, patientId: 2, content: 'Hi' } as any)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('listConversations', () => {
    it('should return conversations', async () => {
      prisma.conversation.findMany.mockResolvedValue([]);
      prisma.conversation.count.mockResolvedValue(0);
      const result = await service.listConversations({});
      expect(result).toBeDefined();
    });
  });

  describe('getUnreadOverview', () => {
    it('should return overview', async () => {
      prisma.user.findUnique.mockResolvedValue({ userId: 1, userType: 'PATIENT' });
      prisma.message.groupBy = jest.fn().mockResolvedValue([]);
      prisma.conversationFicheRequest.count = jest.fn().mockResolvedValue(0);
      const result = await service.getUnreadOverview(1);
      expect(result).toBeDefined();
    });
  });
});

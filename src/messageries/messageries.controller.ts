import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { MessageriesService } from './messageries.service';
import { SendDmMessageDto } from './dto/send-dm-message.dto';
import { QueryConversationsDto } from './dto/query-conversations.dto';
import { QueryMessagesDto } from 'src/common/dto/query-messages.dto';
import { MarkConversationReadDto } from './dto/mark-conversation-read.dto';
import { QueryConversationDetailDto } from './dto/query-conversation-detail.dto';
import { SendFicheRequestDto } from './dto/send-fiche-request.dto';
import { SubmitFicheResponseDto } from './dto/submit-fiche-response.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ActiveAndVerifiedGuard } from 'src/auth/guards/active-verified.guard';
import { QuerySummaryAiDto } from './dto/query-summary-ai.dto';

@ApiTags('messageries (DM)')
@Controller('messageries')
 @ApiBearerAuth('JWT-auth')
  // @UseGuards(JwtAuthGuard, ActiveAndVerifiedGuard)
export class MessageriesController {
  constructor(private readonly svc: MessageriesService) {}

  /* ---------- DM texte / fichiers ---------- */
  @Post('messages')
  @ApiOperation({ summary: 'Envoyer un message DM (médecin ↔ patient)' })
  @ApiBody({
    schema: {
      example: {
        medecinId: 2,
        patientId: 7,
        senderId: 7,
        content: 'Bonjour docteur, j’ai des maux de tête.',
        meta: { attachments: [{ name: 'photo.jpg', url: 'https://...' }] }
      }
    }
  })
  send(@Body() dto: SendDmMessageDto) {
    return this.svc.sendDmMessage(dto.senderId, dto);
  }

  @Get('conversations')
  @ApiOperation({ summary: 'Lister les conversations (filtres, pagination, non-lus)' })
  listConversations(@Query() query: QueryConversationsDto) {
    return this.svc.listConversations(query);
  }

  @Get('conversations/:id/messages')
  @ApiOperation({ summary: 'Lister les messages d’une conversation (asc, pagination)' })
  listMessages(@Param('id') id: string, @Query() query: QueryMessagesDto) {
    return this.svc.listMessages(Number(id), query);
  }

  @Patch('conversations/:id/read')
  @ApiOperation({ summary: 'Marquer tous les messages reçus comme lus' })
  @ApiBody({ schema: { example: { readerId: 7 } } })
  markRead(@Param('id') id: string, @Body() dto: MarkConversationReadDto) {
    return this.svc.markConversationRead(Number(id), dto.readerId);
  }

  @Get('conversations/:id')
  @ApiOperation({ summary: 'Détail conversation (mark-as-read), messages triés DESC' })
  getConversation(@Param('id') id: string, @Query() query: QueryConversationDetailDto) {
    return this.svc.getConversationAndMarkRead(Number(id), query);
  }

  @Get('unread-overview')
  @ApiOperation({ summary: 'Récapitulatif des non-lus (DM) pour un utilisateur' })
  unreadOverview(@Query('forUserId') forUserId: string) {
    return this.svc.getUnreadOverview(Number(forUserId));
  }

  /* ---------- Fiches : ENVOI / RÉPONSE ---------- */
  @Post('fiches/requests')
  @ApiOperation({ summary: 'Envoyer une DEMANDE de fiche (dans un DM, médecin → patient)' })
  @ApiBody({ schema: { example: { conversationId: 5, ficheId: 1, senderId: 2 } } })
  sendFicheRequest(@Body() dto: SendFicheRequestDto) {
    return this.svc.sendFicheRequest(dto);
  }

  @Post('fiches/responses')
  @ApiOperation({ summary: 'Soumettre une RÉPONSE de fiche (dans un DM)' })
  @ApiBody({
    schema: {
      example: {
        conversationId: 5, ficheId: 1, senderId: 7,
        answers: [
          { questionId: "q-uuid-1", optionValue: "1_jour" },
          { questionId: "q-uuid-2", valueText: "Fièvre 38.5" }
        ],
        requestMessageId: 42
      }
    }
  })
  submitFicheResponse(@Body() dto: SubmitFicheResponseDto) {
    return this.svc.submitFicheResponse(dto);
  }

  @Get('fiches/responses/by-conversation/:conversationId')
  @ApiOperation({ summary: 'Lister les réponses (stockées JSON) pour une conversation (items enrichis avec la définition de la question)' })
  listFicheResponsesByConversation(@Param('conversationId') conversationId: string) {
    return this.svc.listFicheResponsesByConversation(Number(conversationId));
  }

  // --- nouveau endpoint : toutes les questions d'une fiche + réponses pour la conversation ---
  @Get('fiches/responses/by-conversation/:conversationId/fiches/:ficheId')
  @ApiOperation({ summary: 'Récupérer toutes les questions d’une fiche et les réponses (pour une conversation donnée)' })
  getFicheQuestionsAndResponses(
    @Param('conversationId') conversationId: string,
    @Param('ficheId') ficheId: string,
  ) {
    return this.svc.getFicheQuestionsAndResponses(Number(conversationId), Number(ficheId));
  }

@Get('fiches/summary/by-conversation/:conversationId')
@ApiOperation({ summary: 'Résumé automatique des fiches structurées (MISTIDRACS ou libres)' })
async getConversationSummary(@Param('conversationId') conversationId: string) {
  return this.svc.generateConversationSummary(Number(conversationId));
}


@Get('fiches/summary-mistidracs/by-conversation/:conversationId')
@ApiOperation({ summary: 'Résumé MISTIDRACS via OpenAI' })
getMistidracsOpenAI(
  @Param('conversationId') conversationId: string,
) {
  return this.svc.generateConversationSummaryMistidracs(
    Number(conversationId),
  );
}

@Get('fiches/summary-mistidracs-gemini/by-conversation/:conversationId')
@ApiOperation({ summary: 'Résumé MISTIDRACS via Gemini' })
getMistidracsGemini(
  @Param('conversationId') conversationId: string,
) {
  return this.svc.generateConversationMistidracsGemini(
    Number(conversationId),
  );
}



}

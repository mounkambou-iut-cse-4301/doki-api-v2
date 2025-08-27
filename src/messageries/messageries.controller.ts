import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { MessageriesService } from './messageries.service';
import { SendMessageDto } from './dto/send-message.dto';
import { QueryConversationsDto } from './dto/query-conversations.dto';
import { QueryMessagesDto } from './dto/query-messages.dto';
import { MarkConversationReadDto } from './dto/mark-conversation-read.dto';
import { QueryConversationDetailDto } from './dto/query-conversation-detail.dto';

@ApiTags('messageries')
@Controller('messageries')
export class MessageriesController {
  constructor(private readonly svc: MessageriesService) {}

  @Post('messages')
  @ApiOperation({ summary: 'Envoyer un message (texte ou form)' })
  send(@Body() dto: SendMessageDto) {
    // ✅ Swagger verra bien le schéma grâce au DTO concret
    return this.svc.sendMessage(dto.senderId, dto);
  }

  @Get('conversations')
  @ApiOperation({ summary: 'Lister les conversations (filtres & pagination)' })
  listConversations(@Query() query: QueryConversationsDto) {
    return this.svc.listConversations(query);
  }

  @Get('conversations/:id/messages')
  @ApiOperation({ summary: 'Lister les messages d’une conversation (pagination)' })
  listMessages(@Param('id') id: string, @Query() query: QueryMessagesDto) {
    return this.svc.listMessages(Number(id), query);
  }

  @Patch('conversations/:id/read')
@ApiOperation({ summary: 'Marquer tous les messages reçus comme lus' })
@ApiBody({ type: MarkConversationReadDto }) // <- aide Swagger à afficher le body
markRead(@Param('id') id: string, @Body() dto: MarkConversationReadDto) {
  return this.svc.markConversationRead(Number(id), dto.readerId);
}

@Get('conversations/:id')
  @ApiOperation({
    summary: 'Obtenir une conversation (marque comme lue pour readerId) – messages du plus récent au plus ancien',
  })
  getConversation(
    @Param('id') id: string,
    @Query() query: QueryConversationDetailDto,
  ) {
    return this.svc.getConversationAndMarkRead(Number(id), query);
  }
}

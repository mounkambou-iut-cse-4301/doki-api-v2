import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CasDifficilesService } from './cas-difficiles.service';

import { QueryMessagesDto } from 'src/common/dto/query-messages.dto';
import { CreateCasDto } from './dto/create-cas.dto';
import { QueryCasDto } from './dto/query-cas.dto';
import { SendCasMessageDto } from './dto/send-cas-message.dto';
import { MarkCasReadDto } from './dto/mark-cas-read.dto';

@ApiTags('cas-difficiles')
@Controller('cas-difficiles')
export class CasDifficilesController {
  constructor(private readonly svc: CasDifficilesService) {}

  @Post()
  @ApiOperation({ summary: 'Créer un cas difficile (ouvert à tous les médecins)' })
  @ApiBody({ schema: { example: { name: 'Suspicion choléra quartier X', description: 'Plusieurs cas', createdBy: 2 } } })
  create(@Body() dto: CreateCasDto) { return this.svc.createCas(dto); }

  @Get()
  @ApiOperation({ summary: 'Lister les cas difficiles (pagination)' })
  list(@Query() query: QueryCasDto) { return this.svc.listCas(query); }

  @Post(':id/messages')
  @ApiOperation({ summary: 'Envoyer un message dans un cas (anonyme possible)' })
  @ApiBody({
    schema: {
      example: {
        senderId: 2,
        content: 'Patient 45 ans, déshydratation sévère',
        anonymous: true,
        meta: { files: [{ name: 'biochimie.pdf', url: 'https://...' }] }
      }
    }
  })
  sendMessage(@Param('id') id: string, @Body() dto: SendCasMessageDto) {
    return this.svc.sendCasMessage(Number(id), dto);
  }

  @Get(':id/messages')
  @ApiOperation({ summary: 'Lister les messages du cas (pagination)' })
  listMessages(@Param('id') id: string, @Query() query: QueryMessagesDto) {
    return this.svc.listCasMessages(Number(id), query);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Marquer le cas comme lu pour un médecin' })
  @ApiBody({ schema: { example: { readerId: 2 } } })
  markRead(@Param('id') id: string, @Body() dto: MarkCasReadDto) {
    return this.svc.markCasRead(Number(id), dto.readerId);
  }

  @Get(':id/unread-count')
  @ApiOperation({ summary: 'Compteur de non-lus pour un médecin' })
  unreadCount(@Param('id') id: string, @Query('forUserId') forUserId: string) {
    return this.svc.casUnreadCount(Number(id), Number(forUserId));
  }
}

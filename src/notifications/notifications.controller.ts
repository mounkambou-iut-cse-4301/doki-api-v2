// ===== src/notifications/notifications.controller.ts =====
import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { SaveExpoTokenDto } from './dto/save-expo-token.dto';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { QueryNotificationDto } from './dto/query-notification.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ActiveAndVerifiedGuard } from 'src/auth/guards/active-verified.guard';

@ApiTags('notifications')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, ActiveAndVerifiedGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly svc: NotificationsService) {}

  @Patch('expo-token')
  @ApiOperation({ summary: 'Sauvegarder le token Expo pour le user courant' })
  saveExpoToken( @Body() dto: SaveExpoTokenDto) {
    return this.svc.saveExpoToken(dto);
  }

  @Post()
  @ApiOperation({ summary: 'Créer une notification' })
  create(@Body() dto: CreateNotificationDto) {
    return this.svc.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lister les notifications (filtres + pagination)' })
  findAll(@Query() query: QueryNotificationDto) {
    return this.svc.findAll(query);
  }

//   @Get(':id')
//   @ApiOperation({ summary: 'Récupérer une notification par ID (doit appartenir au user)' })
//   findOne(@Param('id') id: string, @Req() req: any) {
//     return this.svc.findOne(Number(id), req.user.sub);
//   }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Marquer une notification comme lue' })
  markAsRead(@Param('id') id: string) {
    return this.svc.markAsRead(Number(id));
  }
}


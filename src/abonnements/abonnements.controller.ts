import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AbonnementsService } from './abonnements.service';
import { CreateAbonnementDto } from './dto/create-abonnement.dto';
import { QueryAbonnementDto } from './dto/query-abonnement.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ActiveAndVerifiedGuard } from 'src/auth/guards/active-verified.guard';

 @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, ActiveAndVerifiedGuard)
@ApiTags('abonnements')
@Controller('abonnements')
export class AbonnementsController {
  constructor(private readonly svc: AbonnementsService) {}

  @Post()
  @ApiOperation({ summary: 'Créer un abonnement' })
  @ApiResponse({ status: 201, description: 'Abonnement créé.' })
  create(@Body() dto: CreateAbonnementDto) {
    return this.svc.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lister les abonnements' })
  @ApiResponse({ status: 200, description: 'Liste paginée.' })
  findAll(@Query() query: QueryAbonnementDto) {
    return this.svc.findAll(query);
  }

  @Patch(':id/confirm')
  @ApiOperation({ summary: 'Confirmer un abonnement' })
  @ApiResponse({ status: 200, description: 'Abonnement confirmé.' })
  confirm(@Param('id', ParseIntPipe) id: number) {
    return this.svc.confirm(id);
  }
}

// ===== src/suivis/suivis.controller.ts =====
import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SuivisService } from './suivis.service';
import { CreateSuiviDto } from './dto/create-suivi.dto';
import { UpdateSuiviDto } from './dto/update-suivi.dto';
import { QuerySuiviDto } from './dto/query-suivi.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ActiveAndVerifiedGuard } from 'src/auth/guards/active-verified.guard';

@ApiTags('suivis')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, ActiveAndVerifiedGuard)
@Controller('suivis')
export class SuivisController {
  constructor(private readonly svc: SuivisService) {}

  @Get()
  @ApiOperation({ summary: 'Lister les suivis (filtres + pagination)' })
  findAll(@Query() query: QuerySuiviDto) {
    return this.svc.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtenir un suivi avec détails patient/ordonnance' })
  findOne(@Param('id') id: string) {
    return this.svc.findOne(Number(id));
  }

  @Post()
  @ApiOperation({ summary: 'Créer des suivis (days x heures) — duplication automatique' })
  create(@Body() dto: CreateSuiviDto) {
    return this.svc.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour un suivi' })
  update(@Param('id') id: string, @Body() dto: UpdateSuiviDto) {
    return this.svc.update(Number(id), dto);
  }

  @Patch(':id/toggle')
  @ApiOperation({ summary: 'Basculer le statut isTaken (true/false)' })
  toggle(@Param('id') id: string) {
    return this.svc.toggle(Number(id));
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un suivi' })
  remove(@Param('id') id: string) {
    return this.svc.remove(Number(id));
  }
}



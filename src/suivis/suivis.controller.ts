// src/suivis/suivis.controller.ts
import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { SuivisService } from './suivis.service';
import { CreateSuiviDto } from './dto/create-suivi.dto';
import { UpdateSuiviDto } from './dto/update-suivi.dto';
import { QuerySuiviDto } from './dto/query-suivi.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ActiveAndVerifiedGuard } from 'src/auth/guards/active-verified.guard';

@ApiTags('suivis')
@ApiBearerAuth('JWT-auth')
// @UseGuards(JwtAuthGuard, ActiveAndVerifiedGuard)
@Controller('suivis')
export class SuivisController {
  constructor(private readonly svc: SuivisService) {}

  @Get()
    @ApiPropertyOptional({ description: 'Lister les suivis' })

  findAll(@Query() query: QuerySuiviDto) {
    return this.svc.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtenir un suivi par ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.svc.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Créer un nouveau suivi' })
  create(@Body() dto: CreateSuiviDto) {
    return this.svc.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour un suivi' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateSuiviDto) {
    return this.svc.update(id, dto);
  }

  // @Patch(':id/toggle')
  // @ApiOperation({ summary: 'Activer/Désactiver un suivi' })
  // toggle(@Param('id', ParseIntPipe) id: number) {
  //   return this.svc.toggle(id);
  // }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un suivi' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.svc.remove(id);
  }
}

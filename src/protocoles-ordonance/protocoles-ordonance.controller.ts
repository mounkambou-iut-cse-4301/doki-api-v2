// src/protocoles-ordonance/protocoles-ordonance.controller.ts
import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ProtocolesOrdonanceService } from './protocoles-ordonance.service';
import { CreateProtocoleOrdonanceDto } from './dto/create-protocole-ordonance.dto';
import { UpdateProtocoleOrdonanceDto } from './dto/update-protocole-ordonance.dto';
import { QueryProtocoleOrdonanceDto } from './dto/query-protocole-ordonance.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ActiveAndVerifiedGuard } from 'src/auth/guards/active-verified.guard';

@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, ActiveAndVerifiedGuard)
@ApiTags('protocoles-ordonance')
@Controller('protocoles-ordonance')
export class ProtocolesOrdonanceController {
  constructor(private readonly svc: ProtocolesOrdonanceService) {}

  @Post()
  @ApiOperation({ summary: 'Créer un protocole ordonnance (nom maladie + traitement pré-rempli)' })
  @ApiResponse({ status: 201, description: 'Protocole créé.' })
  create(@Body() dto: CreateProtocoleOrdonanceDto) { return this.svc.create(dto); }

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour un protocole' })
  @ApiParam({ name: 'id', type: 'integer' })
  @ApiResponse({ status: 200, description: 'Protocole mis à jour.' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateProtocoleOrdonanceDto) { return this.svc.update(id, dto); }

  @Get(':id')
  @ApiOperation({ summary: 'Obtenir un protocole par ID' })
  @ApiParam({ name: 'id', type: 'integer' })
  @ApiResponse({ status: 200, description: 'Protocole retourné.' })
  findOne(@Param('id', ParseIntPipe) id: number) { return this.svc.findOne(id); }

  @Get()
  @ApiOperation({ summary: 'Lister les protocoles (recherche par nom maladie)' })
  @ApiResponse({ status: 200, description: 'Liste des protocoles retournée.' })
  findAll(@Query() q: QueryProtocoleOrdonanceDto) { return this.svc.findAll(q); }
}

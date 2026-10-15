// src/protocoles-ordonance/protocoles-ordonance.controller.ts
import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiExtraModels, ApiOperation, ApiParam, ApiResponse, ApiTags, getSchemaPath } from '@nestjs/swagger';
import { ProtocolesOrdonanceService } from './protocoles-ordonance.service';
import { CreateProtocoleOrdonanceDto } from './dto/create-protocole-ordonance.dto';
import { UpdateProtocoleOrdonanceDto } from './dto/update-protocole-ordonance.dto';
import { QueryProtocoleOrdonanceDto } from './dto/query-protocole-ordonance.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ActiveAndVerifiedGuard } from 'src/auth/guards/active-verified.guard';
import { QueryMedicamentDto } from './dto/query-medicament.dto';
import { UpdateMedicamentDto } from './dto/update-medicament.dto';
import { CreateMedicamentDto } from './dto/create-medicament.dto';
import { protocoleExample } from 'src/ordonances/ordonances.swagger';

@ApiBearerAuth('JWT-auth')
// @UseGuards(JwtAuthGuard, ActiveAndVerifiedGuard)
@ApiTags('protocoles-ordonance')
@Controller('protocoles-ordonance')
export class ProtocolesOrdonanceController {
  constructor(private readonly svc: ProtocolesOrdonanceService) {}


   @Post('medicaments')
  @ApiOperation({ summary: 'Créer un médicament' })
  @ApiResponse({ status: 201, description: 'Médicament créé.' })
  createMedicament(@Body() dto: CreateMedicamentDto) {
    return this.svc.createMedicament(dto);
  }

  @Patch('medicaments/:id')
  @ApiOperation({ summary: 'Mettre à jour un médicament' })
  @ApiParam({ name: 'id', type: 'integer' })
  @ApiResponse({ status: 200, description: 'Médicament mis à jour.' })
  updateMedicament(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMedicamentDto,
  ) {
    return this.svc.updateMedicament(id, dto);
  }

  @Delete('medicaments/:id')
  @ApiOperation({ summary: 'Supprimer un médicament' })
  @ApiParam({ name: 'id', type: 'integer' })
  @ApiResponse({ status: 200, description: 'Médicament supprimé.' })
  deleteMedicament(@Param('id', ParseIntPipe) id: number) {
    return this.svc.deleteMedicament(id);
  }

  @Get('medicaments/:id')
  @ApiOperation({ summary: 'Obtenir un médicament par ID' })
  @ApiParam({ name: 'id', type: 'integer' })
  @ApiResponse({ status: 200, description: 'Médicament retourné.' })
  findOneMedicament(@Param('id', ParseIntPipe) id: number) {
    return this.svc.findOneMedicament(id);
  }

  @Get('medicaments')
  @ApiOperation({
    summary: 'Lister les médicaments (search par nom scientifique, nom commercial, nom labo, dosage, forme, voie, posologie)',
  })
  @ApiResponse({ status: 200, description: 'Liste des médicaments retournée.' })
  findAllMedicaments(@Query() q: QueryMedicamentDto) {
    return this.svc.findAllMedicaments(q);
  }


  @Post()
  @ApiOperation({
    summary: 'Créer un protocole ordonnance (modèle réutilisable)',
    description: 'Enregistre un modèle nommé avec un tableau de traitements JSON. Cette route ne crée ni ordonnance patient, ni suivi, ni notification. Pour envoyer ce protocole à un patient : lire item.traitement via GET /protocoles-ordonance/{id}, adapter les traitements et dates, puis appeler POST /ordonances avec reservationId, medecinId, patientId et traitement. patientId est fourni uniquement au niveau principal, jamais dans les traitements. Voir l’exemple « Envoyer un protocole adapté au patient » dans POST /ordonances. Le nom du protocole doit être unique.',
  })
  @ApiExtraModels(CreateProtocoleOrdonanceDto)
  @ApiBody({
    required: true,
    schema: { $ref: getSchemaPath(CreateProtocoleOrdonanceDto) },
    examples: { modele: { summary: 'Modèle à adapter avant envoi au patient', value: protocoleExample } },
  })
  @ApiResponse({ status: 201, description: 'Protocole créé.' })
  create(@Body() dto: CreateProtocoleOrdonanceDto) { return this.svc.create(dto); }

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour un protocole' })
  @ApiParam({ name: 'id', type: 'integer' })
  @ApiResponse({ status: 200, description: 'Protocole mis à jour.' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateProtocoleOrdonanceDto) { return this.svc.update(id, dto); }

  @Get(':id')
  @ApiOperation({ summary: 'Obtenir un protocole par ID', description: 'Retourne { item }. Pour créer une ordonnance depuis ce modèle, reprendre item.traitement, adapter les dates et les prises, puis envoyer le corps complet à POST /ordonances avec patientId au niveau principal uniquement. Envoyer uniquement protocoleId n’est pas pris en charge.' })
  @ApiParam({ name: 'id', type: 'integer' })
  @ApiResponse({ status: 200, description: 'Protocole retourné.' })
  findOne(@Param('id', ParseIntPipe) id: number) { return this.svc.findOne(id); }

  @Get()
  @ApiOperation({ summary: 'Lister les protocoles (recherche par nom maladie)' })
  @ApiResponse({ status: 200, description: 'Liste des protocoles retournée.' })
  findAll(@Query() q: QueryProtocoleOrdonanceDto) { return this.svc.findAll(q); }
}

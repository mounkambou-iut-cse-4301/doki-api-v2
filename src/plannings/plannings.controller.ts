import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PlanningsService } from './plannings.service';
import { CreatePlanningDto } from './dto/create-planning.dto';
import { UpdatePlanningDto } from './dto/update-planning.dto';
import { GetSlotsDto } from './dto/get-slots.dto';

@ApiTags('planning')
@Controller('planning')
export class PlanningsController {
    constructor(private readonly svc: PlanningsService) {}

  @Post()
  @ApiOperation({ summary: 'Créer un planning pour un médecin' })
  @ApiResponse({ status: 201, description: 'Planning créé.' })
  create(@Body() dto: CreatePlanningDto) {
    return this.svc.create(dto);
  }

  @Patch(':medecinId')
  @ApiOperation({ summary: 'Mettre à jour le planning d’un médecin' })
  @ApiParam({ name: 'medecinId', type: 'integer' })
  update(
    @Param('medecinId', ParseIntPipe) medecinId: number,
    @Body() dto: UpdatePlanningDto,
  ) {
    return this.svc.update(medecinId, dto);
  }

  @Get('slots')
  @ApiOperation({ summary: 'Lister les créneaux dispo pour un médecin un jour donné' })
  @ApiResponse({ status: 200, description: 'Liste des créneaux.' })
  getSlots(@Query() dto: GetSlotsDto) {
    return this.svc.getSlots(dto);
  }
}

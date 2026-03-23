// src/planning/plannings.controller.ts
import { 
  Body, 
  Controller, 
  Delete, 
  Get, 
  Param, 
  ParseIntPipe, 
  Patch, 
  Post, 
  Query, 
  UseGuards 
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PlanningsService } from './plannings.service';
import { CreatePlanningDto } from './dto/create-planning.dto';
import { UpdatePlanningDto } from './dto/update-planning.dto';
import { UpdateJourStatusDto } from './dto/update-jour-status.dto';
import { GetSlotsDto } from './dto/get-slots.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ActiveAndVerifiedGuard } from 'src/auth/guards/active-verified.guard';
import { 
  ApiCreateOrUpdatePlannings,
  ApiUpdateJourStatus,
  ApiGetPlanningsByMedecin,
  ApiGetSlots,
  ApiDeleteAllPlannings,
  ApiDeleteSlot
} from './decorators/api-planning.decorator';

@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, ActiveAndVerifiedGuard)
@ApiTags('planning')
@Controller('planning')
export class PlanningsController {
  constructor(private readonly svc: PlanningsService) {}

  @Post()
  @ApiCreateOrUpdatePlannings()
  async createOrUpdate(@Body() dto: CreatePlanningDto) {
    return this.svc.createOrUpdate(dto);
  }

  @Patch(':medecinId/jour-status')
  @ApiUpdateJourStatus()
  async updateJourStatus(
    @Param('medecinId', ParseIntPipe) medecinId: number,
    @Body() dto: UpdateJourStatusDto
  ) {
    return this.svc.updateJourStatus(medecinId, dto);
  }

  @Get('medecin/:medecinId')
  @ApiGetPlanningsByMedecin()
  async findByMedecin(@Param('medecinId', ParseIntPipe) medecinId: number) {
    return this.svc.findByMedecin(medecinId);
  }

  @Get('slots')
  @ApiGetSlots()
  async getSlots(@Query() dto: GetSlotsDto) {
    return this.svc.getSlots(dto);
  }

  @Delete('medecin/:medecinId')
  @ApiDeleteAllPlannings()
  async removeAll(@Param('medecinId', ParseIntPipe) medecinId: number) {
    return this.svc.removeAll(medecinId);
  }

  @Delete('slot/:planningId')
  @ApiDeleteSlot()
  async removeSlot(@Param('planningId', ParseIntPipe) planningId: number) {
    return this.svc.removeSlot(planningId);
  }
}
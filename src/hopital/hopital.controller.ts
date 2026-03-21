import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  DefaultValuePipe,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { HopitalService } from './hopital.service';
import { CreateHopitalDto } from './dto/create-hopital.dto';
import { UpdateHopitalDto } from './dto/update-hopital.dto';
import { HopitalQueryDto } from './dto/hopital-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { AddMedecinsDto, RemoveMedecinsDto } from './dto/add-medecin.dto';
import { 
      ApiCreateHopital,
  ApiGetAllHopitaux,
  ApiGetHopitalById,
  ApiUpdateHopital,
  ApiAddMedecinsToHopital,
  ApiRemoveMedecinsFromHopital,
  ApiGetHopitalMedecins,
  ApiGetHopitalReservations,
  ApiGetHopitalStats,


 } from './decorators/api-hopital.decorator';

@ApiTags('Hôpitaux')
@Controller('api/v1/hopital')
export class HopitalController {
  constructor(private readonly hopitalService: HopitalService) {}

  @Post()
  @ApiCreateHopital()
  async create(@Body() createDto: CreateHopitalDto) {
    return this.hopitalService.create(createDto);
  }

  @Get()
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @ApiGetAllHopitaux()
  async findAll(@Query() query: HopitalQueryDto) {
    return this.hopitalService.findAll(query);
  }

  @Get(':id')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @ApiGetHopitalById()
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.hopitalService.findOne(id);
  }

  @Patch(':id')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @ApiUpdateHopital()
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateHopitalDto,
  ) {
    return this.hopitalService.update(id, updateDto);
  }

  @Post(':id/medecins')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @ApiAddMedecinsToHopital()
  async addMedecins(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AddMedecinsDto,
  ) {
    return this.hopitalService.addMedecins(id, dto);
  }

  @Delete(':id/medecins')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @ApiRemoveMedecinsFromHopital()
  async removeMedecins(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RemoveMedecinsDto,
  ) {
    return this.hopitalService.removeMedecins(id, dto);
  }

  @Get(':id/medecins')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @ApiGetHopitalMedecins()
  async getMedecins(
    @Param('id', ParseIntPipe) id: number,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.hopitalService.getMedecins(id, page, limit);
  }

  @Get(':id/reservations')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @ApiGetHopitalReservations()
  async getReservations(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: any,
  ) {
    return this.hopitalService.getReservations(id, query);
  }

  @Get(':id/stats')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @ApiGetHopitalStats()
  async getStats(@Param('id', ParseIntPipe) id: number) {
    return this.hopitalService.getStats(id);
  }
}
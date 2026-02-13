import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { OrdonancesService } from './ordonances.service';
import { CreateOrdonanceDto } from './dto/create-ordonance.dto';
import { UpdateOrdonanceDto } from './dto/update-ordonance.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ActiveAndVerifiedGuard } from 'src/auth/guards/active-verified.guard';
import { OrdonanceFilterDto } from './dto/ordonance-filter.dto';

 @ApiBearerAuth('JWT-auth')
  // @UseGuards(JwtAuthGuard, ActiveAndVerifiedGuard)
@ApiTags('ordonances')
@Controller('ordonances')
export class OrdonancesController {

    constructor(private readonly svc: OrdonancesService) {}
 @Post()
  @ApiOperation({ summary: 'Créer une ordonnance' })
  @ApiResponse({ status: 201, description: 'Ordonnance créée.' })
  create(@Body() dto: CreateOrdonanceDto) {
    return this.svc.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour une ordonnance' })
  @ApiParam({ name: 'id', type: 'integer' })
  @ApiResponse({ status: 200, description: 'Ordonnance mise à jour.' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateOrdonanceDto) {
    return this.svc.update(id, dto);
  }

      @Get()
    @ApiOperation({ summary: 'Obtenir toutes les ordonnances avec filtres et pagination' })
    @ApiResponse({ status: 200, description: 'Liste des ordonnances retournée.' })
    async findAll(@Query() filters: OrdonanceFilterDto) {
        return this.svc.findAll(filters);
    }

  @Get(':id')
  @ApiOperation({ summary: 'Obtenir une ordonnance par ID' })
  @ApiParam({ name: 'id', type: 'integer' })
  @ApiResponse({ status: 200, description: 'Ordonnance retournée.' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.svc.findOne(id);
  }

    @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une ordonnance (cascade FK)' })
  @ApiParam({ name: 'id', type: 'integer' })
  @ApiResponse({ status: 200, description: 'Ordonnance supprimée.' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.svc.remove(id);
  }
}

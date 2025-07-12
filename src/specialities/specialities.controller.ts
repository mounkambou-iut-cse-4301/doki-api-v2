import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { SpecialitiesService } from './specialities.service';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { CreateSpecialityDto } from './dto/create-specialityDto';
import { UpdateSpecialityDto } from './dto/update-specialityDto';
import { QuerySpecialityDto } from './dto/query-specialityDto';

@Controller('specialities')
export class SpecialitiesController {
  constructor(private readonly specialityService: SpecialitiesService) {}

  @Post()
  @ApiOperation({ summary: 'Créer une nouvelle spécialité' })
  @ApiResponse({
    status: 201,
    description: 'Spécialité créée avec succès.',
  })
  @ApiResponse({ status: 409, description: 'Conflit si le nom existe déjà.' })
  create(@Body() dto: CreateSpecialityDto) {
    return this.specialityService.createSpecialy(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour une spécialité' })
  @ApiParam({
    name: 'id',
    description: 'ID de la spécialité à modifier',
    type: 'integer',
  })
  @ApiResponse({ status: 200, description: 'Spécialité mise à jour.' })
  @ApiResponse({ status: 404, description: 'ID introuvable.' })
  @ApiResponse({ status: 409, description: 'Name déjà existant.' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSpecialityDto,
  ) {
    return this.specialityService.update(id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lister les spécialités (pagination)' })
  @ApiResponse({ status: 200, description: 'Liste retournée.' })
findAll(@Query() query: QuerySpecialityDto) {
  // Conversion manuelle
  const page  = parseInt(query.page  as any, 10) || 1;
  const limit = parseInt(query.limit as any, 10) || 10;
  return this.specialityService.findAll(page, limit);
}

@Get(':id')
  @ApiOperation({ summary: 'Obtenir une spécialité par ID' })
  @ApiParam({
    name: 'id',
    description: "ID de la spécialité à récupérer",
    type: 'integer',
  })
  @ApiResponse({
    status: 200,
    description: 'Spécialité trouvée et retournée.',
  })
  @ApiResponse({
    status: 404,
    description: 'Spécialité introuvable.',
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.specialityService.findOne(id);
  }
}

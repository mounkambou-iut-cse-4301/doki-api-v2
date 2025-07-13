import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { OrdonancesService } from './ordonances.service';
import { CreateOrdonanceDto } from './dto/create-ordonance.dto';
import { UpdateOrdonanceDto } from './dto/update-ordonance.dto';
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

  @Get(':id')
  @ApiOperation({ summary: 'Obtenir une ordonnance par ID' })
  @ApiParam({ name: 'id', type: 'integer' })
  @ApiResponse({ status: 200, description: 'Ordonnance retournée.' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.svc.findOne(id);
  }
}

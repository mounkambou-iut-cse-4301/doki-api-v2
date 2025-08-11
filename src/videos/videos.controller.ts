import { Controller, Post, Patch, Get, Body, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { VideosService } from './videos.service';
import { CreateVideoDto } from './dto/create-video.dto';
import { UpdateVideoDto } from './dto/update-video.dto';
import { QueryVideoDto } from './dto/query-video.dto';

@ApiTags('videos')
@Controller('videos')
export class VideosController {
  constructor(private readonly svc: VideosService) {}

  @Post()
  @ApiOperation({ summary: 'Créer une vidéo' })
  @ApiResponse({ status: 201, description: 'Vidéo créée.' })
  create(@Body() dto: CreateVideoDto) {
    return this.svc.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour une vidéo' })
  @ApiParam({ name: 'id', type: 'integer' })
  @ApiResponse({ status: 200, description: 'Vidéo mise à jour.' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateVideoDto) {
    return this.svc.update(id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lister les vidéos (filtres & pagination)' })
  @ApiResponse({ status: 200, description: 'Liste retournée.' })
  findAll(@Query() query: QueryVideoDto) {
    return this.svc.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d\'une vidéo' })
  @ApiParam({ name: 'id', type: 'integer' })
  @ApiResponse({ status: 200, description: 'Détails retournés.' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.svc.findOne(id);
  }
}
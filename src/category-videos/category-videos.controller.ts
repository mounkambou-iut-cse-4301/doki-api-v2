import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CategoryVideosService } from './category-videos.service';
import { CreateCategoryVideoDto } from './dto/create-category-video.dto';
import { UpdateCategoryVideoDto } from './dto/update-category-video.dto';
import { QueryCategoryVideoDto } from './dto/query-category-video.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ActiveAndVerifiedGuard } from 'src/auth/guards/active-verified.guard';

@ApiBearerAuth('JWT-auth')
// @UseGuards(JwtAuthGuard, ActiveAndVerifiedGuard)
@ApiTags('category-videos')
@Controller('category-videos')
export class CategoryVideosController {
  constructor(private readonly svc: CategoryVideosService) {}

  @Post()
  @ApiOperation({ summary: 'Créer une catégorie vidéo' })
  @ApiResponse({ status: 201, description: 'Catégorie créée.' })
  create(@Body() dto: CreateCategoryVideoDto) {
    return this.svc.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour une catégorie vidéo' })
  @ApiParam({ name: 'id', type: 'integer' })
  @ApiResponse({ status: 200, description: 'Catégorie mise à jour.' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCategoryVideoDto) {
    return this.svc.update(id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lister les catégories (filtres & pagination)' })
  @ApiResponse({ status: 200, description: 'Liste retournée.' })
  findAll(@Query() query: QueryCategoryVideoDto) {
    return this.svc.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d\'une catégorie (inclut le nombre de vidéos)' })
  @ApiParam({ name: 'id', type: 'integer' })
  @ApiResponse({ status: 200, description: 'Détails retournés.' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.svc.findOne(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une catégorie (refus si vidéos liées)' })
  @ApiParam({ name: 'id', type: 'integer' })
  @ApiResponse({ status: 200, description: 'Catégorie supprimée.' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.svc.remove(id);
  }
}

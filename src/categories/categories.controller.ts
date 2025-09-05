import { Controller, Get, Param, ParseIntPipe, Post, Body, Patch, Query } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { ApiQuery } from '@nestjs/swagger';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly service: CategoriesService) {}

  // GET /categories?search=...&createdFrom=YYYY-MM-DD&createdTo=YYYY-MM-DD&page=1&limit=10
  @Get()
    @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'createdFrom', required: false, type: String, example: '2025-01-01' })
  @ApiQuery({ name: 'createdTo', required: false, type: String, example: '2025-12-31' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  findAll(@Query() q: Record<string, string | string[] | undefined>) {
    // parsing manuel (pas de DTO de query/pagination)
    const page = q.page ? Number(q.page) : 1;
    const limit = q.limit ? Number(q.limit) : 10;

    const filters = {
      search: (q.search as string) || undefined,
      createdFrom: (q.createdFrom as string) || undefined,
      createdTo: (q.createdTo as string) || undefined,
      page: Number.isFinite(page) && page > 0 ? page : 1,
      limit: Number.isFinite(limit) && limit > 0 ? limit : 10,
    };

    return this.service.findAll(filters);
  }

  // GET /categories/:id
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  // POST /categories
  @Post()
  create(@Body() dto: CreateCategoryDto) {
    return this.service.create(dto);
  }

  // PATCH /categories/:id
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCategoryDto) {
    return this.service.update(id, dto);
  }
}

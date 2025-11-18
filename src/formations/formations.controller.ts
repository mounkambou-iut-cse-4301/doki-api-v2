import {
  Controller,
  Get,
  Param,
  ParseBoolPipe,
  ParseIntPipe,
  Post,
  Body,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { FormationsService } from './formations.service';
import { CreateFormationDto } from './dto/create-formation.dto';
import { UpdateFormationDto } from './dto/update-formation.dto';
import { ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ActiveAndVerifiedGuard } from 'src/auth/guards/active-verified.guard';

@Controller('formations-continues')
 @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, ActiveAndVerifiedGuard)
export class FormationsController {
  constructor(private readonly service: FormationsService) {}

  // GET /formations-continues?search=...&categoryId=1&minDuree=2&maxDuree=10&includeLessons=true&page=1&limit=10
  @Get()
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'categoryId', required: false, type: Number })
  @ApiQuery({ name: 'minDuree', required: false, type: Number })
  @ApiQuery({ name: 'maxDuree', required: false, type: Number })
  @ApiQuery({ name: 'includeLessons', required: false, type: Boolean })
  @ApiQuery({ name: 'createdFrom', required: false, type: String, example: '2025-01-01' })
  @ApiQuery({ name: 'createdTo', required: false, type: String, example: '2025-12-31' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  findAll(@Query() q: Record<string, string | string[] | undefined>) {
    const page = q.page ? Number(q.page) : 1;
    const limit = q.limit ? Number(q.limit) : 10;

    const filters = {
      search: (q.search as string) || undefined,
      categoryId: q.categoryId ? Number(q.categoryId) : undefined,
      minDuree: q.minDuree ? Number(q.minDuree) : undefined,
      maxDuree: q.maxDuree ? Number(q.maxDuree) : undefined,
      includeLessons: q.includeLessons === 'true',
      createdFrom: (q.createdFrom as string) || undefined,
      createdTo: (q.createdTo as string) || undefined,
      page: Number.isFinite(page) && page > 0 ? page : 1,
      limit: Number.isFinite(limit) && limit > 0 ? limit : 10,
    };

    return this.service.findAll(filters);
  }

  // GET /formations-continues/:id?includeLessons=true
  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Query('includeLessons', new ParseBoolPipe({ optional: true })) includeLessons?: boolean,
  ) {
    return this.service.findOne(id, includeLessons ?? true);
  }

  // POST /formations-continues
  @Post()
  create(@Body() dto: CreateFormationDto) {
    return this.service.create(dto);
  }

  // PATCH /formations-continues/:id
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateFormationDto) {
    return this.service.update(id, dto);
  }
}

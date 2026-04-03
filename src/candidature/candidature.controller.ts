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
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CandidatureService } from './candidature.service';
import { CreateCandidatureDto } from './dto/create-candidature.dto';
import { UpdateCandidatureDto } from './dto/update-candidature.dto';
import { CandidatureQueryDto } from './dto/candidature-query.dto';
import { CancelCandidatureDto } from './dto/cancel-candidature.dto';
import {
  ApiAcceptCandidature,
  ApiCancelCandidatures,
  ApiCreateCandidature,
  ApiDeleteCandidature,
  ApiGetAllCandidatures,
  ApiGetCandidatureById,
  ApiRejectCandidature,
  ApiUpdateCandidature,
} from './decorators/api-candidature.decorator';

@ApiTags('Candidatures')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('api/v1/candidature')
export class CandidatureController {
  constructor(private readonly candidatureService: CandidatureService) {}

  @Post()
  @ApiCreateCandidature()
  async create(@Body() dto: CreateCandidatureDto) {
    return this.candidatureService.create(dto);
  }

  @Get()
  @ApiGetAllCandidatures()
  async findAll(@Query() query: CandidatureQueryDto) {
    return this.candidatureService.findAll(query);
  }

  @Patch('cancel')
  @ApiCancelCandidatures()
  async cancelMany(@Body() dto: CancelCandidatureDto) {
    return this.candidatureService.cancelMany(dto);
  }

  @Get(':id')
  @ApiGetCandidatureById()
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.candidatureService.findOne(id);
  }

  @Patch(':id')
  @ApiUpdateCandidature()
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCandidatureDto,
  ) {
    return this.candidatureService.update(id, dto);
  }

  @Delete(':id')
  @ApiDeleteCandidature()
  async delete(@Param('id', ParseIntPipe) id: number) {
    return this.candidatureService.delete(id);
  }

  @Patch(':id/accept')
  @ApiAcceptCandidature()
  async accept(@Param('id', ParseIntPipe) id: number) {
    return this.candidatureService.accept(id);
  }

  @Delete(':id/reject')
  @ApiRejectCandidature()
  async reject(@Param('id', ParseIntPipe) id: number) {
    return this.candidatureService.reject(id);
  }
}
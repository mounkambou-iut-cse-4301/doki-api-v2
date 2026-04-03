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
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PublicitesService } from './publicites.service';
import { CreatePackagePubliciteDto } from './dto/create-package-publicite.dto';
import { UpdatePackagePubliciteDto } from './dto/update-package-publicite.dto';
import { CreatePubliciteDto } from './dto/create-publicite.dto';
import { UpdatePubliciteDto } from './dto/update-publicite.dto';
import { PubliciteQueryDto } from './dto/publicite-query.dto';
import { PackagePubliciteQueryDto } from './dto/package-publicite-query.dto';
import { AdminPubliciteQueryDto } from './dto/admin-publicite-query.dto';
import {
  ApiCancelPublicite,
  ApiCreatePackagePublicite,
  ApiCreatePublicite,
  ApiGetAllPackagesPublicite,
  ApiGetAllPublicitesAdmin,
  ApiGetAllPublicitesVisibles,
  ApiGetPackagePubliciteById,
  ApiGetPubliciteById,
  ApiTerminatePublicite,
  ApiUpdatePackagePublicite,
  ApiUpdatePublicite,
} from './decorators/api-publicite.decorator';

@ApiTags('Publicités')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('api/v1/publicites')
export class PublicitesController {
  constructor(private readonly publicitesService: PublicitesService) {}

  @Post('packages')
  @ApiCreatePackagePublicite()
  async createPackage(@Body() dto: CreatePackagePubliciteDto) {
    return this.publicitesService.createPackage(dto);
  }

  @Patch('packages/:id')
  @ApiUpdatePackagePublicite()
  async updatePackage(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePackagePubliciteDto,
  ) {
    return this.publicitesService.updatePackage(id, dto);
  }

  @Get('packages')
  @ApiGetAllPackagesPublicite()
  async getAllPackages(@Query() query: PackagePubliciteQueryDto) {
    return this.publicitesService.getAllPackages(query);
  }

  @Get('packages/:id')
  @ApiGetPackagePubliciteById()
  async getOnePackage(@Param('id', ParseIntPipe) id: number) {
    return this.publicitesService.getOnePackage(id);
  }

  @Post()
  @ApiCreatePublicite()
  async createPublicite(@Body() dto: CreatePubliciteDto) {
    return this.publicitesService.createPublicite(dto);
  }

  @Get('admin/toutes')
  @ApiGetAllPublicitesAdmin()
  async findAllAdmin(@Query() query: AdminPubliciteQueryDto) {
    return this.publicitesService.findAllAdmin(query);
  }

  @Get()
  @ApiGetAllPublicitesVisibles()
  async findAll(@Query() query: PubliciteQueryDto) {
    return this.publicitesService.findAll(query);
  }

  @Get(':id')
  @ApiGetPubliciteById()
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.publicitesService.findOne(id);
  }

  @Patch(':id')
  @ApiUpdatePublicite()
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePubliciteDto,
  ) {
    return this.publicitesService.update(id, dto);
  }

  @Delete(':id')
  @ApiCancelPublicite()
  async cancel(@Param('id', ParseIntPipe) id: number) {
    return this.publicitesService.cancel(id);
  }

  @Patch(':id/terminer')
  @ApiTerminatePublicite()
  async terminate(@Param('id', ParseIntPipe) id: number) {
    return this.publicitesService.terminate(id);
  }
}
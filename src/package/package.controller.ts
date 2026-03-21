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
import { PackageService } from './package.service';
import { CreatePackageDto } from './dto/create-package.dto';
import { UpdatePackageDto } from './dto/update-package.dto';
import { PackageQueryDto } from './dto/package-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  ApiCreatePackage,
  ApiGetAllPackages,
  ApiGetPackageById,
  ApiUpdatePackage,
  ApiDeletePackage,
  ApiActivatePackage,
  ApiDeactivatePackage,
  ApiGetPackagesBySpeciality,
} from './decorators/api-package.decorator';

@ApiTags('Packages pour les spécialités en groupe')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('api/v1/packages')
export class PackageController {
  constructor(private readonly packageService: PackageService) {}

  @Post()
  @ApiCreatePackage()
  async create(@Body() createDto: CreatePackageDto) {
    return this.packageService.create(createDto);
  }

  @Get()
  @ApiGetAllPackages()
  async findAll(@Query() query: PackageQueryDto) {
    return this.packageService.findAll(query);
  }

  @Get(':id')
  @ApiGetPackageById()
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.packageService.findOne(id);
  }

  @Patch(':id')
  @ApiUpdatePackage()
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdatePackageDto,
  ) {
    return this.packageService.update(id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiDeletePackage()
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.packageService.remove(id);
  }

  @Post(':id/activate')
  @HttpCode(HttpStatus.OK)
  @ApiActivatePackage()
  async activate(@Param('id', ParseIntPipe) id: number) {
    return this.packageService.activate(id);
  }

  @Post(':id/deactivate')
  @HttpCode(HttpStatus.OK)
  @ApiDeactivatePackage()
  async deactivate(@Param('id', ParseIntPipe) id: number) {
    return this.packageService.deactivate(id);
  }

  @Get('speciality/:specialityId')
  @ApiGetPackagesBySpeciality()
  async getBySpeciality(
    @Param('specialityId', ParseIntPipe) specialityId: number,
    @Query('onlyActive', new DefaultValuePipe(true)) onlyActive: boolean,
  ) {
    return this.packageService.getBySpeciality(specialityId, onlyActive);
  }
}
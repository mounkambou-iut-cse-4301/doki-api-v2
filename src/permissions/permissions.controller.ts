import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PermissionsService } from './permissions.service';
import { GetPermissionsQueryDto } from './dto/get-permissions-query.dto';

@ApiTags('permissions')
@ApiBearerAuth('JWT-auth')
// @UseGuards(JwtAuthGuard, ActiveAndVerifiedGuard)
@Controller('permissions')
export class PermissionsController {
  constructor(private readonly svc: PermissionsService) {}


  @Get()
  @ApiOperation({ summary: 'Lister les permissions (avec filtres/pagination)' })
  @ApiResponse({ status: 200, description: 'Liste paginée.' })
  findAll(@Query() query: GetPermissionsQueryDto) {
    return this.svc.findAll(query);
  }
}

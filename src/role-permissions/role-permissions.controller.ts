import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RolePermissionsService } from './role-permissions.service';
import { AssignRolePermissionsDto } from './dto/assign-role-permissions.dto';
import { RemoveRolePermissionsDto } from './dto/remove-role-permissions.dto';

@ApiTags('role-permissions')
@ApiBearerAuth('JWT-auth')
// @UseGuards(JwtAuthGuard, ActiveAndVerifiedGuard)
@Controller('role-permissions')
export class RolePermissionsController {
  constructor(private readonly svc: RolePermissionsService) {}

  @Post('assign')
  @ApiOperation({ summary: 'Attribuer une ou plusieurs permissions à un rôle' })
  @ApiResponse({ status: 200, description: 'Permissions du rôle mises à jour.' })
  assign(@Body() dto: AssignRolePermissionsDto) {
    return this.svc.assign(dto);
  }

  @Post('remove')
  @ApiOperation({ summary: 'Retirer une ou plusieurs permissions d’un rôle' })
  @ApiResponse({ status: 200, description: 'Permissions du rôle mises à jour.' })
  remove(@Body() dto: RemoveRolePermissionsDto) {
    return this.svc.remove(dto);
  }

  @Get(':roleId')
  @ApiOperation({ summary: 'Lister les permissions d’un rôle' })
  @ApiResponse({ status: 200, description: 'Liste des permissions.' })
  listByRole(@Param('roleId') roleId: string) {
    return this.svc.listByRole(Number(roleId));
  }
}

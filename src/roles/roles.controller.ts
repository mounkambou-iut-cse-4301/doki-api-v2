import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  // UseGuards
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
// import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
// import { ActiveAndVerifiedGuard } from 'src/auth/guards/active-verified.guard';

@ApiTags('roles')
@ApiBearerAuth('JWT-auth')
// @UseGuards(JwtAuthGuard, ActiveAndVerifiedGuard)
@Controller('roles')
export class RolesController {
  constructor(private readonly svc: RolesService) {}

  @Post()
  @ApiOperation({ summary: 'Créer un rôle (nom en MAJUSCULE sans accents)' })
  @ApiResponse({ status: 201, description: 'Rôle créé.' })
  create(@Body() dto: CreateRoleDto) {
    return this.svc.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lister tous les rôles' })
  @ApiResponse({ status: 200, description: 'Liste des rôles.' })
  findAll() {
    return this.svc.findAll();
  }

  @Get(':roleId')
  @ApiOperation({ summary: 'Récupérer un rôle par son ID' })
  @ApiResponse({ status: 200, description: 'Rôle trouvé.' })
  @ApiResponse({ status: 404, description: 'Rôle introuvable.' })
  findOne(@Param('roleId', ParseIntPipe) roleId: number) {
    return this.svc.findOne(roleId);
  }

  @Patch(':roleId')
  @ApiOperation({ summary: 'Mettre à jour un rôle' })
  @ApiResponse({ status: 200, description: 'Rôle mis à jour.' })
  @ApiResponse({ status: 404, description: 'Rôle introuvable.' })
  update(
    @Param('roleId', ParseIntPipe) roleId: number,
    @Body() dto: UpdateRoleDto,
  ) {
    return this.svc.update(roleId, dto);
  }

  @Delete(':roleId')
  @ApiOperation({
    summary: "Supprimer un rôle (uniquement s'il n'est référencé par aucune FK)",
  })
  @ApiResponse({ status: 200, description: 'Rôle supprimé.' })
  @ApiResponse({
    status: 400,
    description: 'Suppression impossible car rôle référencé.',
  })
  @ApiResponse({ status: 404, description: 'Rôle introuvable.' })
  remove(@Param('roleId', ParseIntPipe) roleId: number) {
    return this.svc.remove(roleId);
  }
}
import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ActiveAndVerifiedGuard } from 'src/auth/guards/active-verified.guard';

@ApiTags('roles') // 👈 ce tag va apparaître dans Swagger
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
}

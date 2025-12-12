import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { CreateMedecinDto } from './dto/create-medecin.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { UpdateMedecinDto } from './dto/update-medecin.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ActiveAndVerifiedGuard } from 'src/auth/guards/active-verified.guard';
import { UpdateUserRoleDto } from 'src/roles/dto/update-user-role.dto';
import { CreateAdminDto } from './dto/create-admin.dto';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly svc: UsersService) {}

  @Post('signup/patient')
  @ApiOperation({ summary: 'Inscription d’un patient' })
  @ApiResponse({ status: 201, description: 'Patient créé.' })
  signupPatient(@Body() dto: CreatePatientDto) {
    return this.svc.signupPatient(dto);
  }

  @Post('signup/medecin')
  @ApiOperation({ summary: 'Inscription d’un médecin' })
  @ApiResponse({ status: 201, description: 'Médecin créé.' })
  signupMedecin(@Body() dto: CreateMedecinDto) {
    return this.svc.signupMedecin(dto);
  }
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, ActiveAndVerifiedGuard)
  @Patch('patient/:id')
  @ApiOperation({ summary: 'Mettre à jour un patient' })
  @ApiParam({ name: 'id', type: 'integer' })
  @ApiResponse({ status: 200, description: 'Patient mis à jour.' })
  updatePatient(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePatientDto,
  ) {
    return this.svc.updatePatient(id, dto);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, ActiveAndVerifiedGuard)
  @Patch('medecin/:id')
  @ApiOperation({ summary: 'Mettre à jour un médecin' })
  @ApiParam({ name: 'id', type: 'integer' })
  @ApiResponse({ status: 200, description: 'Médecin mis à jour.' })
  updateMedecin(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMedecinDto,
  ) {
    return this.svc.updateMedecin(id, dto);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, ActiveAndVerifiedGuard)
  @Get()
  @ApiOperation({ summary: 'Lister les utilisateurs (filtres & pagination)' })
  @ApiResponse({ status: 200, description: 'Liste retournée.' })
  findAll(@Query() query: QueryUserDto) {
    return this.svc.findAll(query);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, ActiveAndVerifiedGuard)
  @Get(':id')
  @ApiOperation({ summary: 'Obtenir un utilisateur par ID' })
  @ApiParam({ name: 'id', type: 'integer' })
  @ApiResponse({ status: 200, description: 'Utilisateur trouvé.' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.svc.findOne(id);
  }

  @Post('signup/admin')
@ApiOperation({ summary: 'Créer un administrateur avec ses rôles (roleIds)' })
@ApiResponse({ status: 201, description: 'Administrateur créé.' })
signupAdmin(@Body() dto: CreateAdminDto) {
  return this.svc.signupAdmin(dto);
}

@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, ActiveAndVerifiedGuard)
@Post(':id/roles')
@ApiOperation({ summary: 'Attribuer un rôle à un administrateur (par roleId)' })
@ApiParam({ name: 'id', type: 'integer' })
addRoleToAdmin(
  @Param('id', ParseIntPipe) id: number,
  @Body() dto: UpdateUserRoleDto,
) {
  return this.svc.addRoleToAdmin(id, dto.roleId);
}

@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, ActiveAndVerifiedGuard)
@Post(':id/roles/remove')
@ApiOperation({ summary: 'Retirer un rôle à un administrateur (par roleId)' })
@ApiParam({ name: 'id', type: 'integer' })
removeRoleFromAdmin(
  @Param('id', ParseIntPipe) id: number,
  @Body() dto: UpdateUserRoleDto,
) {
  return this.svc.removeRoleFromAdmin(id, dto.roleId);
}
}

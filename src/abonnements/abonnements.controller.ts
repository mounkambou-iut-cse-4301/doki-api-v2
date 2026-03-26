import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AbonnementsService } from './abonnements.service';
import { CreateAbonnementDto } from './dto/create-abonnement.dto';
import { QueryAbonnementDto } from './dto/query-abonnement.dto';
import {
  ApiSubscribePackage,
  ApiGetAbonnementsActifs,
  ApiGetHistoriqueAbonnements,
  ApiGetAbonnementsBySpecialite,
  ApiGetAbonnementById,
  ApiConfirmAbonnement,
  ApiGetAllAbonnements,
} from './decorators/api-abonnement.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ActiveAndVerifiedGuard } from 'src/auth/guards/active-verified.guard';

@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, ActiveAndVerifiedGuard)
@ApiTags('abonnements')
@Controller('abonnements')
export class AbonnementsController {
  constructor(private readonly svc: AbonnementsService) {}

  @Post()
  @ApiSubscribePackage()
  subscribe(@Body() dto: CreateAbonnementDto) {
    return this.svc.subscribeToPackage(dto);
  }

  @Get('active')
  @ApiGetAbonnementsActifs()
  @ApiQuery({ name: 'userId', required: true, type: Number, description: 'ID du patient' })
  getActiveSubscriptions(
    @Query('userId') userId: number,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    // Vérifier que userId est fourni
    if (!userId) {
      throw new BadRequestException({
        message: 'Le paramètre userId est requis',
        messageE: 'UserId parameter is required',
      });
    }
    return this.svc.getActiveSubscriptions(userId, page, limit);
  }

  @Get('history')
  @ApiGetHistoriqueAbonnements()
  @ApiQuery({ name: 'userId', required: true, type: Number, description: 'ID du patient' })
  getHistory(
    @Query('userId') userId: number,
    @Query() query: QueryAbonnementDto,
  ) {
    // Vérifier que userId est fourni
    if (!userId) {
      throw new BadRequestException({
        message: 'Le paramètre userId est requis',
        messageE: 'UserId parameter is required',
      });
    }
    return this.svc.getSubscriptionHistory(userId, query);
  }

  @Get('speciality')
  @ApiGetAbonnementsBySpecialite()
  @ApiQuery({ name: 'userId', required: true, type: Number, description: 'ID du médecin' })
  getBySpeciality(
    @Query('userId') userId: number,
    @Query() query: QueryAbonnementDto,
  ) {
    // Vérifier que userId est fourni
    if (!userId) {
      throw new BadRequestException({
        message: 'Le paramètre userId est requis',
        messageE: 'UserId parameter is required',
      });
    }
    return this.svc.getSubscriptionsBySpeciality(userId, query);
  }

  @Get(':id')
  @ApiGetAbonnementById()
  findOne(
    @Param('id', ParseIntPipe) id: number,
  ) {

    return this.svc.findOne(id);
  }

  @Get()
  @ApiGetAllAbonnements()
  findAll(@Query() query: QueryAbonnementDto) {
    return this.svc.findAll(query);
  }

  @Patch(':id/confirm')
  @ApiConfirmAbonnement()
  confirm(@Param('id', ParseIntPipe) id: number) {
    return this.svc.confirm(id);
  }
}
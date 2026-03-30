// src/reservations/reservations.controller.ts
import {
  Controller,
  Post,
  Patch,
  Get,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { ReservationsService } from './reservations.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDateDto } from './dto/update-reservation-date.dto';
import { QueryReservationDto } from './dto/query-reservation.dto';
import { RateDoctorDto } from './dto/rate-doctor.dto';
import {
  ApiCreateReservation,
  ApiUpdateReservationDate,
  ApiGetReservationById,
  ApiGetAllReservations,
  ApiRateDoctor,
} from './decorators/api-reservation.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ActiveAndVerifiedGuard } from 'src/auth/guards/active-verified.guard';

@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, ActiveAndVerifiedGuard)
@ApiTags('reservations')
@Controller('reservations')
export class ReservationsController {
  constructor(private readonly svc: ReservationsService) {}

  @Post()
  @ApiCreateReservation()
  create(@Body() dto: CreateReservationDto) {
    return this.svc.create(dto);
  }

  @Patch(':id/start')
  @ApiOperation({ 
    summary: 'Démarrer une consultation',
    description: 'Le médecin démarre la consultation. Peut être fait 2 minutes avant l\'heure prévue ou à tout moment après.'
  })
  @ApiParam({ name: 'id', type: Number, description: 'ID de la réservation' })
  @ApiResponse({ status: 200, description: 'Consultation démarrée avec succès' })
  @ApiResponse({ status: 400, description: 'Impossible de démarrer la consultation (trop tôt ou statut invalide)' })
  start(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ) {
    return this.svc.startConsultation(id, req.user.userId);
  }

  @Patch(':id/complete')
  @ApiOperation({ 
    summary: 'Terminer une consultation',
    description: 'Le médecin termine la consultation. Le paiement est effectué et le médecin/hôpital est crédité après déduction de la commission plateforme.'
  })
  @ApiParam({ name: 'id', type: Number, description: 'ID de la réservation' })
  @ApiResponse({ status: 200, description: 'Consultation terminée avec succès' })
  @ApiResponse({ status: 400, description: 'Impossible de terminer la consultation (trop tôt ou statut invalide)' })
  complete(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ) {
    return this.svc.completeConsultation(id, req.user.userId);
  }

  @Patch(':id/date')
  @ApiUpdateReservationDate()
  updateDate(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateReservationDateDto,
  ) {
    return this.svc.updateDate(id, dto);
  }

  @Get(':id')
  @ApiGetReservationById()
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.svc.findOne(id);
  }

  @Get()
  @ApiGetAllReservations()
  findAll(@Query() query: QueryReservationDto) {
    return this.svc.findAll(query);
  }

  @Post(':id/rate')
  @ApiRateDoctor()
  rate(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RateDoctorDto,
  ) {
    return this.svc.rateDoctor(id, dto);
  }
}
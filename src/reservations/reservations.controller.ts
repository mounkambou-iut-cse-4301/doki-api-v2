import {
  Controller,
  Post,
  Patch,
  Get,
  Body,
  Param,
  Query,
  ParseIntPipe,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ReservationsService } from './reservations.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDateDto } from './dto/update-reservation-date.dto';
import { QueryReservationDto } from './dto/query-reservation.dto';
import { RateDoctorDto } from './dto/rate-doctor.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ActiveAndVerifiedGuard } from 'src/auth/guards/active-verified.guard';

 @ApiBearerAuth('JWT-auth')
  // @UseGuards(JwtAuthGuard, ActiveAndVerifiedGuard)
@ApiTags('reservations')
@Controller('reservations')
export class ReservationsController {
     constructor(private readonly svc: ReservationsService) {}

  @Post()
  @ApiOperation({ summary: 'Créer une réservation' })
  @ApiResponse({ status: 201, description: 'Réservation créée.' })
  create(@Body() dto: CreateReservationDto) {
    return this.svc.create(dto);
  }

  @Patch(':id/date')
  @ApiOperation({ summary: 'Modifier date/heure (>= 24 h avant)' })
  @ApiParam({ name: 'id', type: 'integer' })
  updateDate(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateReservationDateDto,
  ) {
    return this.svc.updateDate(id, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtenir une réservation par ID' })
  @ApiParam({ name: 'id', type: 'integer' })
  @ApiResponse({ status: 200, description: 'Réservation retournée.' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.svc.findOne(id);
  }

  @Get()
  @ApiOperation({ summary: 'Lister les réservations (filtres & pagination)' })
  @ApiResponse({ status: 200, description: 'Liste retournée.' })
  findAll(@Query() query: QueryReservationDto) {
    return this.svc.findAll(query);
  }

    @Patch(':id/complete')
  @ApiOperation({ summary: 'Marquer une réservation comme complétée' })
  @ApiParam({ name: 'id', type: 'integer' })
  @ApiResponse({ status: 200, description: 'Réservation complétée.' })
  complete(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.svc.completeReservation(id);
  }

  @Post(':id/rate')
  @ApiOperation({ summary: 'Noter le médecin d’une réservation complétée' })
  @ApiParam({ name: 'id', type: 'integer' })
  @ApiResponse({ status: 201, description: 'Feedback créé.' })
  rate(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RateDoctorDto,
  ) {
    return this.svc.rateDoctor(id, dto);
  }
}

// src/reservations/dto/reservation-response.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform, Type } from 'class-transformer';
import { ReservationStatus, ReservationType, Sex } from 'generated/prisma';

// ==================== DTOs de base (définis en premier) ====================

export class SpecialitySimpleDto {
  @ApiProperty({ example: 1 })
  @Expose()
  specialityId: number;

  @ApiProperty({ example: 'Cardiologie' })
  @Expose()
  name: string;

  @ApiProperty({ example: 25000 })
  @Expose()
  @Transform(({ value }) => Number(value))
  consultationPrice: number;

  @ApiProperty({ example: 30 })
  @Expose()
  consultationDuration: number;
}

export class PatientSimpleDto {
  @ApiProperty({ example: 1 })
  @Expose()
  userId: number;

  @ApiProperty({ example: 'Jean' })
  @Expose()
  firstName: string;

  @ApiProperty({ example: 'Dupont' })
  @Expose()
  lastName: string;

  @ApiProperty({ example: 'jean@example.com' })
  @Expose()
  email: string;

  @ApiPropertyOptional({ example: 'https://...' })
  @Expose()
  profile?: string;
}

// MedecinSimpleDto doit être défini APRÈS SpecialitySimpleDto
export class MedecinSimpleDto {
  @ApiProperty({ example: 1 })
  @Expose()
  userId: number;

  @ApiProperty({ example: 'Dr Jean' })
  @Expose()
  firstName: string;

  @ApiProperty({ example: 'Dupont' })
  @Expose()
  lastName: string;

  @ApiPropertyOptional({ example: 'https://...' })
  @Expose()
  profile?: string;

  @ApiPropertyOptional()
  @Expose()
  @Type(() => SpecialitySimpleDto)
  speciality?: SpecialitySimpleDto;
}

// FeedbackSimpleDto défini APRÈS PatientSimpleDto
export class FeedbackSimpleDto {
  @ApiProperty({ example: 1 })
  @Expose()
  feedbackId: number;

  @ApiProperty({ example: 5 })
  @Expose()
  note: number;

  @ApiPropertyOptional({ example: 'Excellent médecin !' })
  @Expose()
  comment?: string;

  @ApiProperty({ example: '2026-03-30T10:00:00.000Z' })
  @Expose()
  createdAt: Date;

  @ApiPropertyOptional({ type: PatientSimpleDto })
  @Expose()
  @Type(() => PatientSimpleDto)
  patient?: PatientSimpleDto;
}

// ==================== DTOs principaux ====================

export class ReservationResponseDto {
  @ApiProperty({ example: 1 })
  @Expose()
  reservationId: number;

  @ApiProperty({ example: '2026-03-30' })
  @Expose()
  date: string;

  @ApiProperty({ example: '14:30' })
  @Expose()
  hour: string;

  @ApiProperty({ enum: ReservationType, example: 'CALL' })
  @Expose()
  type: ReservationType;

  @ApiProperty({ example: 'Jean Dupont' })
  @Expose()
  patientName: string;

  @ApiProperty({ enum: Sex, example: 'MALE' })
  @Expose()
  sex: Sex;

  @ApiPropertyOptional({ example: 30 })
  @Expose()
  age?: number;

  @ApiPropertyOptional({ example: 'Douleur thoracique' })
  @Expose()
  description?: string;

  @ApiProperty({ example: 1 })
  @Expose()
  medecinId: number;

  @ApiProperty({ example: 2 })
  @Expose()
  patientId: number;

  @ApiPropertyOptional({ example: 'Hopital Central' })
  @Expose()
  location?: string;

  @ApiPropertyOptional({ example: 25000 })
  @Expose()
  @Transform(({ value }) => value ? Number(value) : null)
  amount?: number;

  @ApiPropertyOptional({ example: 1 })
  @Expose()
  transactionId?: number;

  @ApiPropertyOptional({ example: 3 })
  @Expose()
  hopitalId?: number;

  @ApiPropertyOptional({ example: 5 })
  @Expose()
  abonnementId?: number;

  @ApiProperty({ enum: ReservationStatus, example: 'PENDING' })
  @Expose()
  status: ReservationStatus;

  @ApiProperty({ example: '2026-03-30T10:00:00.000Z' })
  @Expose()
  createdAt: Date;

  @ApiPropertyOptional({ type: MedecinSimpleDto })
  @Expose()
  @Type(() => MedecinSimpleDto)
  medecin?: MedecinSimpleDto;

  @ApiPropertyOptional({ type: PatientSimpleDto })
  @Expose()
  @Type(() => PatientSimpleDto)
  patient?: PatientSimpleDto;

  @ApiPropertyOptional({ description: 'Heure de fin estimée' })
  @Expose()
  endHour?: string;

  @ApiPropertyOptional({ description: 'Utilisation d\'un abonnement' })
  @Expose()
  usedSubscription?: boolean;
}

export class ReservationPaginatedResponseDto {
  @ApiProperty({ example: 'Réservations récupérées avec succès' })
  message: string;

  @ApiProperty({ example: 'Reservations retrieved successfully' })
  messageE: string;

  @ApiProperty({ type: [ReservationResponseDto] })
  @Type(() => ReservationResponseDto)
  data: ReservationResponseDto[];

  @ApiProperty({
    example: {
      total: 10,
      page: 1,
      limit: 10,
      pageCount: 1,
    },
  })
  meta: {
    total: number;
    page: number;
    limit: number;
    pageCount: number;
  };
}

export class SingleReservationResponseDto {
  @ApiProperty({ example: 'Réservation récupérée avec succès' })
  message: string;

  @ApiProperty({ example: 'Reservation retrieved successfully' })
  messageE: string;

  @ApiProperty({ type: ReservationResponseDto })
  @Type(() => ReservationResponseDto)
  data: ReservationResponseDto;

  @ApiPropertyOptional({
    description: 'Statistiques des avis du médecin',
    example: { average: 4.5, count: 12 },
  })
  medecinRating?: { average: number; count: number };

  @ApiPropertyOptional({ type: [FeedbackSimpleDto] })
  @Type(() => FeedbackSimpleDto)
  lastFeedbacks?: FeedbackSimpleDto[];
}
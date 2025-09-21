// src/reservations/dto/query-reservation.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsOptional,
  IsInt,
  Min,
  IsDateString,
  IsEnum,
  IsString,
} from 'class-validator';
import { ReservationType, ReservationStatus } from 'generated/prisma';


export class QueryReservationDto {

    @ApiPropertyOptional({ description: 'Recherche (patientName, noms médecin/patient)' })
  @IsOptional() @IsString()
  q?: string;

  @ApiPropertyOptional({ description: 'Filtrer par ID médecin' })
  @IsOptional() @Type(() => Number) @IsInt()
  medecinId?: number;

  @ApiPropertyOptional({ description: 'Filtrer par ID patient' })
  @IsOptional() @Type(() => Number) @IsInt()
  patientId?: number;

  @ApiPropertyOptional({ description: 'Filtrer par date (YYYY-MM-DD)' })
  @IsOptional() @IsDateString()
  date?: string;

  @ApiPropertyOptional({ enum: ReservationType })
  @IsOptional() @IsEnum(ReservationType)
  type?: ReservationType;

  @ApiPropertyOptional({ enum: ReservationStatus })
  @IsOptional() @IsEnum(ReservationStatus)
  status?: ReservationStatus;

  @ApiPropertyOptional({ description: 'Page (>=1)', default: 1 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Limite (>=1)', default: 10 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  limit?: number = 10;
}
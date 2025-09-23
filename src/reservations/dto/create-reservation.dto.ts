// src/reservations/dto/create-reservation.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsInt,
  IsOptional,
  IsDateString,
  Min,
  IsNumber,
} from 'class-validator';
import { ReservationType, Sex } from 'generated/prisma';

export class CreateReservationDto {
  @ApiProperty({ description: 'Date (YYYY-MM-DD)' })
  @IsNotEmpty() @IsString()
  date: string;

  @ApiProperty({ description: 'Heure (HH:MM:SS)' })
  @IsNotEmpty() @IsString()
  hour: string;

  @ApiProperty({ enum: ReservationType })
  @IsEnum(ReservationType)
  type: ReservationType;

  @ApiProperty({ description: 'Prénom du patient' })
  @IsNotEmpty() @IsString()
  patientName: string;

  @ApiProperty({ enum: Sex })
  @IsEnum(Sex)
  sex: Sex;

  @ApiPropertyOptional({ description: 'Âge', minimum: 0 })
  @IsOptional() @IsInt() @Min(0)
  age?: number;

  @ApiPropertyOptional({ description: 'Description / motif' })
  @IsOptional() @IsString()
  description?: string;

  @ApiProperty({ description: 'ID du médecin' })
  @IsNotEmpty() @IsInt()
  medecinId: number;

  @ApiProperty({ description: 'ID du patient' })
  @IsNotEmpty() @IsInt()
  patientId: number;

  @ApiPropertyOptional({ description: 'Lieu (optionnel)' })
  @IsOptional() @IsString()
  location?: string;

  @ApiProperty({ description: 'ID de la spécialité' })
  @IsNotEmpty() @IsInt()
  specialityId: number;
}

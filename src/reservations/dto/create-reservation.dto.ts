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
} from 'class-validator';
import { ReservationType, Sex } from 'generated/prisma';

export class CreateReservationDto {
  @ApiProperty({ description: 'Date (YYYY-MM-DD)' })
  @IsNotEmpty()
  @IsString()
  date: string;

  @ApiProperty({ description: 'Heure (HH:MM)' })
  @IsNotEmpty()
  @IsString()
  hour: string;

  @ApiProperty({ enum: ReservationType, description: 'CALL = en ligne, IN_PERSON = en présentiel' })
  @IsEnum(ReservationType)
  type: ReservationType;

  @ApiProperty({ description: 'Nom du patient' })
  @IsNotEmpty()
  @IsString()
  patientName: string;

  @ApiProperty({ enum: Sex })
  @IsEnum(Sex)
  sex: Sex;

  @ApiPropertyOptional({ description: 'Âge', minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  age?: number;

  @ApiPropertyOptional({ description: 'Description / motif' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'ID du médecin' })
  @IsNotEmpty()
  @IsInt()
  medecinId: number;

  @ApiProperty({ description: 'ID du patient' })
  @IsNotEmpty()
  @IsInt()
  patientId: number;

  @ApiPropertyOptional({ description: 'Localisation / adresse' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ description: 'ID de l\'hôpital (requis si type = IN_PERSON)' })
  @IsOptional()
  @IsInt()
  hopitalId?: number;

  @ApiProperty({ description: 'ID de la spécialité' })
  @IsNotEmpty()
  @IsInt()
  specialityId: number;
}
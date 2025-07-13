// src/reservations/dto/update-reservation-date.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsDateString, IsString } from 'class-validator';

export class UpdateReservationDateDto {
  @ApiProperty({ description: 'Nouvelle date (YYYY-MM-DD)' })
  @IsNotEmpty() @IsString()
  date: string;

  @ApiProperty({ description: 'Nouvelle heure (HH:MM:SS)' })
  @IsNotEmpty() @IsString()
  hour: string;
}

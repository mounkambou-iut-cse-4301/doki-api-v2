// src/reservations/dto/update-reservation-date.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateReservationDateDto {
  @ApiProperty({ description: 'Nouvelle date (YYYY-MM-DD)' })
  @IsNotEmpty()
  @IsString()
  date: string;

  @ApiProperty({ description: 'Nouvelle heure (HH:MM)' })
  @IsNotEmpty()
  @IsString()
  hour: string;
}
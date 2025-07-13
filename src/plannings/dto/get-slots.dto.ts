// src/planning/dto/get-slots.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsInt, IsDateString } from 'class-validator';

export class GetSlotsDto {
 @ApiProperty({ description: 'ID du médecin', example: 3 })
  @IsNotEmpty()
  @Type(() => Number)      // ← transforme en number
  @IsInt()
  medecinId: number;

  @ApiProperty({ description: 'Date pour laquelle lister les créneaux (YYYY-MM-DD)' })
  @IsNotEmpty() @IsDateString()
  date: string;
}

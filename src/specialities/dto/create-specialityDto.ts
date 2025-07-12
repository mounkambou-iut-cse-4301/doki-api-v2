// src/speciality/dto/create-speciality.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  MaxLength,
  IsNumber,
  Min,
  IsInt,
} from 'class-validator';

export class CreateSpecialityDto {
  @ApiProperty({ description: 'Nom de la spécialité', maxLength: 100 })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: 'Prix de consultation en FCFA (>= 0)',
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  consultationPrice: number;

  @ApiProperty({
    description: 'Montant du plan mensuel en FCFA (>= 0)',
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  planMonthAmount: number;

  @ApiProperty({
    description: "Nombre d'utilisations incluses dans le plan (>= 1)",
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  numberOfTimePlanReservation: number;
}

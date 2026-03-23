// create-medecin.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsInt,
  IsString,
  IsOptional,
  MaxLength,
} from 'class-validator';
import { CreatePatientDto } from './create-patient.dto';

export class CreateMedecinDto extends CreatePatientDto {
  @ApiPropertyOptional({ description: 'Matricule professionnel' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  matricule?: string;

  @ApiPropertyOptional({ description: 'ID de la spécialité du médecin' })
  @IsOptional()
  @IsInt()
  specialityId?: number; // Rendre optionnel
}
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

  @ApiProperty({ description: 'ID de la spécialité du médecin' })
  @IsNotEmpty()
  @IsInt()
  specialityId: number;
}

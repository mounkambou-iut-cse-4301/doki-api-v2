import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsInt, IsBoolean, IsOptional, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePackageDto {
  @ApiProperty({ example: 'Pack Cardiologie Premium', description: 'Nom du package' })
  @IsNotEmpty()
  @IsString()
  nom: string;

  @ApiProperty({ example: 1, description: 'ID de la spécialité' })
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  specialityId: number;

  @ApiProperty({ example: 5, description: 'Nombre de consultations incluses' })
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  nombreConsultations: number;

  @ApiProperty({ example: true, description: 'Chat inclus ou non' })
  @IsNotEmpty()
  @IsBoolean()
  chatInclus: boolean;

  @ApiProperty({ example: true, description: 'Appel inclus ou non' })
  @IsNotEmpty()
  @IsBoolean()
  appelInclus: boolean;

  @ApiProperty({ example: 25000, description: 'Prix du package' })
  @IsNotEmpty()
  @Type(() => Number)
  prix: number;

  @ApiProperty({ example: 30, description: 'Durée de validité en jours' })
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  dureeValiditeJours: number;
}
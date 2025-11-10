// src/ordonances/dto/create-ordonance.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsArray, ValidateNested, IsString, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
import { TreatmentItemDto } from './treatment-item.dto';

export class CreateOrdonanceDto {
  @ApiProperty({ description: 'ID de la réservation' })
  @IsInt()
  reservationId: number;

  @ApiProperty({ description: 'ID du médecin' })
  @IsInt()
  medecinId: number;

  @ApiProperty({ description: 'ID du patient' })
  @IsInt()
  patientId: number;

  @ApiPropertyOptional({ description: "Nom de l'ordonnance (ex: Paludisme – Adulte)" })
  @IsOptional() @IsString() @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ description: 'Durée du traitement' })
  @IsOptional() @IsString()
  dureeTraitement?: string;

  @ApiProperty({ type: [TreatmentItemDto], description: 'Liste des traitements' })
  @IsArray() @ValidateNested({ each: true }) @Type(() => TreatmentItemDto)
  traitement: TreatmentItemDto[];

  @ApiPropertyOptional({ description: 'Commentaire' })
  @IsOptional() @IsString()
  comment?: string;

  @ApiPropertyOptional({ description: 'Fichiers (URL ou base64)' })
  @IsOptional() @IsArray() @IsString({ each: true })
  images?: string[];
}

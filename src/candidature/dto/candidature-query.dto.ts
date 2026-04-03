import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { CandidatureStatus } from 'generated/prisma';

export class CandidatureQueryDto {
  @ApiPropertyOptional({
    example: 'cardiologie',
    description: 'Recherche par description, nom médecin, nom hôpital ou spécialité',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    enum: CandidatureStatus,
    example: CandidatureStatus.PENDING,
  })
  @IsOptional()
  @IsEnum(CandidatureStatus)
  status?: CandidatureStatus;

  @ApiPropertyOptional({
    example: 7,
    description: 'Filtrer par ID médecin',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  medecinId?: number;

  @ApiPropertyOptional({
    example: 15,
    description: 'Filtrer par ID hôpital',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  hopitalId?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}
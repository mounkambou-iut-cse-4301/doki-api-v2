import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsNumber, Min, Max, IsString, IsEnum, ValidateIf } from 'class-validator';
import { CommissionType } from 'generated/prisma';

export class CreateSettingDto {
  @ApiProperty({ description: 'Type de commission en ligne', enum: CommissionType, example: CommissionType.PERCENTAGE, default: CommissionType.PERCENTAGE })
  @IsOptional()
  @IsEnum(CommissionType)
  onlineType?: CommissionType;

  @ApiProperty({ description: 'Valeur de la commission en ligne', example: 10, default: 10 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @ValidateIf((o) => o.onlineType === CommissionType.PERCENTAGE)
  @Max(100, { message: 'Pourcentage ne peut pas dépasser 100%' })
  onlineValue?: number;

  @ApiProperty({ description: 'Type de commission en présentiel', enum: CommissionType, example: CommissionType.FIXED, default: CommissionType.PERCENTAGE })
  @IsOptional()
  @IsEnum(CommissionType)
  onsiteType?: CommissionType;

  @ApiProperty({ description: 'Valeur de la commission en présentiel', example: 2000, default: 15 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @ValidateIf((o) => o.onsiteType === CommissionType.PERCENTAGE)
  @Max(100, { message: 'Pourcentage ne peut pas dépasser 100%' })
  onsiteValue?: number;

  @ApiPropertyOptional({ description: 'Description', example: 'Commission: 10% en ligne, 2000 FCFA fixe en présentiel' })
  @IsOptional()
  @IsString()
  description?: string;
}
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsNumber, Min, Max, IsString, IsEnum, ValidateIf } from 'class-validator';
import { CommissionType } from 'generated/prisma';

export class UpdateSettingDto {
  @ApiPropertyOptional({ description: 'Type de commission en ligne', enum: CommissionType })
  @IsOptional()
  @IsEnum(CommissionType)
  onlineType?: CommissionType;

  @ApiPropertyOptional({ description: 'Valeur de la commission en ligne' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @ValidateIf((o) => o.onlineType === CommissionType.PERCENTAGE)
  @Max(100, { message: 'Pourcentage ne peut pas dépasser 100%' })
  onlineValue?: number;

  @ApiPropertyOptional({ description: 'Type de commission en présentiel', enum: CommissionType })
  @IsOptional()
  @IsEnum(CommissionType)
  onsiteType?: CommissionType;

  @ApiPropertyOptional({ description: 'Valeur de la commission en présentiel' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @ValidateIf((o) => o.onsiteType === CommissionType.PERCENTAGE)
  @Max(100, { message: 'Pourcentage ne peut pas dépasser 100%' })
  onsiteValue?: number;

  @ApiPropertyOptional({ description: 'Description' })
  @IsOptional()
  @IsString()
  description?: string;
}
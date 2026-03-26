import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { CommissionType } from 'generated/prisma';

export class SettingResponseDto {
  @ApiProperty({ example: 1 })
  @Expose()
  settingId: number;

  @ApiProperty({ description: 'Type de commission en ligne', enum: CommissionType, example: CommissionType.PERCENTAGE })
  @Expose()
  onlineType: CommissionType;

  @ApiProperty({ description: 'Valeur de la commission en ligne', example: 10 })
  @Expose()
  onlineValue: number;

  @ApiProperty({ description: 'Type de commission en présentiel', enum: CommissionType, example: CommissionType.PERCENTAGE })
  @Expose()
  onsiteType: CommissionType;

  @ApiProperty({ description: 'Valeur de la commission en présentiel', example: 15 })
  @Expose()
  onsiteValue: number;

  @ApiPropertyOptional({ description: 'Description', example: 'Configuration des commissions' })
  @Expose()
  description?: string;

  @ApiPropertyOptional({ example: 1 })
  @Expose()
  updatedBy?: number;

  @ApiProperty({ example: '2026-03-26T10:00:00.000Z' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ example: '2026-03-26T10:00:00.000Z' })
  @Expose()
  updatedAt: Date;
}
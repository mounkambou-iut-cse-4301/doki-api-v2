import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsInt, IsDateString, IsOptional, IsEnum } from 'class-validator';
import { PlanningType } from 'generated/prisma';

export class GetSlotsDto {
  @ApiProperty({ description: 'ID du médecin', example: 3 })
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  medecinId: number;

  @ApiProperty({ description: 'Date pour laquelle lister les créneaux (YYYY-MM-DD)' })
  @IsNotEmpty()
  @IsDateString()
  date: string;

  @ApiPropertyOptional({ enum: PlanningType, description: 'Type de créneaux' })
  @IsOptional()
  @IsEnum(PlanningType)
  type?: PlanningType;

  @ApiPropertyOptional({ description: 'ID de l\'hôpital' })
  @IsOptional()
  @IsInt()
  hopitalId?: number;
}
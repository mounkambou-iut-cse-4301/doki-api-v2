import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CompleteRetraitDto {
  @ApiProperty({
    example: 1,
    description: "ID de l'admin ou superadmin qui traite le retrait",
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  adminId: number;

  @ApiPropertyOptional({
    example: 'TR-WD-2026-00001',
    description: 'Référence de traitement admin',
  })
  @IsOptional()
  @IsString()
  referenceTraitementAdmin?: string;
}
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CancelRetraitDto {
  // @ApiProperty({
  //   example: 7,
  //   description: "ID de l'acteur qui annule (propriétaire du retrait ou admin)",
  // })
  // @Type(() => Number)
  // @IsInt()
  // @Min(1)
  // acteurId!: number;

  @ApiPropertyOptional({
    example: 'Erreur de montant',
  })
  @IsOptional()
  @IsString()
  motifAnnulation?: string;
}
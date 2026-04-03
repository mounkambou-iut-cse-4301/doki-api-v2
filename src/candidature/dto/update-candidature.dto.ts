import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateCandidatureDto {
  @ApiPropertyOptional({
    example:
      "Version mise à jour de la lettre de motivation avec plus de détails.",
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...',
    description: 'Nouveau fichier base64 ou URL',
  })
  @IsOptional()
  @IsString()
  file?: string;
}
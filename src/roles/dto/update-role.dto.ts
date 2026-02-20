import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateRoleDto {
  @ApiPropertyOptional({
    example: 'MANAGE_MEDECIN',
    description: 'Nom du rôle (sera normalisé en MAJUSCULE sans accents)',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Description du rôle' })
  @IsOptional()
  @IsString()
  description?: string;
}
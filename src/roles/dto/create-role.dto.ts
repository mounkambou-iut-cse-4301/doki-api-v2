import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({
    example: 'MANAGE_PATIENT',
    description: 'Nom du rôle (sera normalisé en MAJUSCULE sans accents)',
  })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Description du rôle' })
  @IsOptional()
  @IsString()
  description?: string;
}

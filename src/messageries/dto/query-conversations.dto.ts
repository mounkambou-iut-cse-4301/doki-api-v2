import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, Min } from 'class-validator';

export class QueryConversationsDto {
  @ApiPropertyOptional({ description: 'Filtrer par médecin' })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  medecinId?: number;

  @ApiPropertyOptional({ description: 'Filtrer par patient' })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  patientId?: number;

  @ApiPropertyOptional({ description: 'Calcul du non-lu pour cet utilisateur' })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  forUserId?: number;

  @ApiPropertyOptional({ description: 'Seulement les conversations avec non-lus (pour forUserId)' })
  @IsOptional() @Type(() => Boolean) @IsBoolean()
  unreadOnly?: boolean;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  limit?: number = 10;
}

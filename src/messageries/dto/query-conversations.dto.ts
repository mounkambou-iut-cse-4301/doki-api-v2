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

  @ApiPropertyOptional({ description: 'Utilisateur pour compter les non-lus' })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  forUserId?: number;

  @ApiPropertyOptional({ description: 'Seulement les conversations avec des non-lus (pour forUserId)' })
  @IsOptional() @Type(() => Boolean) @IsBoolean()
  unreadOnly?: boolean;

  @ApiPropertyOptional({ description: 'Page', default: 1 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Limite', default: 10 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  limit?: number = 10;
}

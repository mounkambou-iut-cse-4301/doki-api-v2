import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class QueryCategoryVideoDto {
  @ApiPropertyOptional({ description: 'Recherche plein texte sur name / description' })
  @IsOptional() @IsString()
  q?: string;

  @ApiPropertyOptional({ description: 'Page (>=1)', default: 1 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Limite (>=1)', default: 10 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  limit?: number = 10;
}

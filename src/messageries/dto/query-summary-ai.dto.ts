import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';

export class QuerySummaryAiDto {
  @ApiPropertyOptional({ example: 'gpt-5-mini' })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional({ enum: ['fr', 'en'], example: 'fr' })
  @IsOptional()
  @IsIn(['fr', 'en'])
  lang?: 'fr' | 'en';
}

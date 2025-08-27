import { ApiProperty } from '@nestjs/swagger';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Min, IsOptional } from 'class-validator';

export class QueryConversationDetailDto {
  @ApiProperty({ description: 'ID du lecteur (participant: patient ou médecin)' })
  @Type(() => Number) @IsInt() @Min(1)
  readerId: number;

  @ApiPropertyOptional({ description: 'Page (>=1)', default: 1 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Limite (>=1)', default: 20 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  limit?: number = 20;
}

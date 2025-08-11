// src/admins/dto/query-transactions.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { TransactionStatus, TransactionType } from 'generated/prisma';

export class QueryTransactionsDto {
  @ApiPropertyOptional({ enum: TransactionStatus })
  @IsOptional() @IsEnum(TransactionStatus)
  status?: TransactionStatus;

  @ApiPropertyOptional({ enum: TransactionType })
  @IsOptional() @IsEnum(TransactionType)
  type?: TransactionType;

  @ApiPropertyOptional({ description: 'Année (ex: 2025)' })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1970)
  year?: number;

  @ApiPropertyOptional({ description: 'Mois (1-12)' })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  month?: number;

  @ApiPropertyOptional({ description: 'Page (>=1)', default: 1 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Limite (>=1)', default: 10 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  limit?: number = 10;
}
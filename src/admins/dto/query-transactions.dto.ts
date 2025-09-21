import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { TransactionStatus, TransactionType } from 'generated/prisma';

export class QueryTransactionsDto {
  @ApiPropertyOptional({ enum: TransactionStatus })
  @IsOptional() @IsEnum(TransactionStatus)
  status?: TransactionStatus;

  @ApiPropertyOptional({ enum: TransactionType })
  @IsOptional() @IsEnum(TransactionType)
  type?: TransactionType;

  @ApiPropertyOptional({ description: 'Année' })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1970)
  year?: number;

  @ApiPropertyOptional({ description: 'Mois 1..12' })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  month?: number;

  @ApiPropertyOptional({ description: 'Recherche (paymentId, noms liés)' })
  @IsOptional() @IsString()
  q?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  limit?: number = 10;
}

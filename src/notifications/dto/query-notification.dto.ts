import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, Min } from 'class-validator';


export class QueryNotificationDto {
@ApiPropertyOptional({ description: 'Filtrer par userId' })
@IsOptional() @Type(() => Number) @IsInt() @Min(1)
userId?: number;


@ApiPropertyOptional({ description: 'Filtrer par statut de lecture' })
@IsOptional() @Type(() => Boolean) @IsBoolean()
isRead?: boolean;


@ApiPropertyOptional({ description: 'Page (>=1)', default: 1 })
@IsOptional() @Type(() => Number) @IsInt() @Min(1)
page?: number = 1;


@ApiPropertyOptional({ description: 'Limite (1–100)', default: 10 })
@IsOptional() @Type(() => Number) @IsInt() @Min(1)
limit?: number = 10;
}
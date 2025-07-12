import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsOptional,
  IsInt,
  Min,
  Max,
  IsString,
  IsEnum,
  IsBoolean,
} from 'class-validator';
import { UserType } from 'generated/prisma';

export class QueryUserDto {
  @ApiPropertyOptional({ description: 'Recherche par nom/prénom' })
  @IsOptional() @IsString()
  name?: string;

  @ApiPropertyOptional({ enum: UserType })
  @IsOptional() @IsEnum(UserType)
  userType?: UserType;

  @ApiPropertyOptional({ description: 'Filtrer les bloqués', example: false })
  @IsOptional() @IsBoolean()
  @Type(() => Boolean)
  isBlock?: boolean;

  @ApiPropertyOptional({ description: "Filtrer par spécialité (ID)", example: 1 })
  @IsOptional() @IsInt()
  @Type(() => Number)
  specialityId?: number;

  @ApiPropertyOptional({ description: 'Filtrer les vérifiés', example: true })
  @IsOptional() @IsBoolean()
  @Type(() => Boolean)
  isVerified?: boolean;

  @ApiPropertyOptional({ description: 'Page (>=1)', default: 1 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Limite (1–100)', default: 10 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100)
  limit?: number = 10;
}

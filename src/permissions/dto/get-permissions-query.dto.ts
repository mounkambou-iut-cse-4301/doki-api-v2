import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, Min } from 'class-validator';

export class GetPermissionsQueryDto {
  @ApiPropertyOptional({ example: 'USER', description: 'Recherche (name ou description)' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: 'VIEW_USERS', description: 'Filtre exact/partiel sur name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? Number(value) : undefined))
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? Number(value) : undefined))
  @Min(1)
  limit?: number;
}

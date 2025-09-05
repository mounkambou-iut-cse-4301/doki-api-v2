import { Type } from 'class-transformer';
import { IsDateString, IsIn, IsInt, IsOptional, IsPositive, IsString, Min } from 'class-validator';

export class FilterCategoryDto {
  @IsOptional()
  @IsString()
  search?: string; // filtre par name (contains, insensitive)

  @IsOptional()
  @IsDateString()
  from?: string;   // createdAt >= from

  @IsOptional()
  @IsDateString()
  to?: string;     // createdAt <= to

  @IsOptional()
  @IsString()
  @IsIn(['name', 'createdAt', 'updatedAt'])
  sortBy?: 'name' | 'createdAt' | 'updatedAt';

  @IsOptional()
  @IsString()
  @IsIn(['asc', 'desc'])
  order?: 'asc' | 'desc';

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  @Min(1)
  page: number = 1;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  @IsPositive()
  @Min(1)
  limit: number = 10;
}

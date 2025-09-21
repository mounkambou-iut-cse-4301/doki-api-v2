import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateCasDto {
  @ApiProperty() @IsString()
  name: string;

  @ApiPropertyOptional() @IsOptional() @IsString()
  description?: string;

  @ApiPropertyOptional() @IsOptional() @IsString()
  diseaseCode?: string;

  @ApiProperty({ description: 'Créateur (médecin)' })
  @IsInt() @Min(1)
  createdBy: number;
}

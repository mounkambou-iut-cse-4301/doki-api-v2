import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, Min, IsOptional, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAbonnementDto {
  @ApiProperty({ description: 'ID du patient', example: 1 })
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt() 
  @Min(1)
  patientId: number;

  @ApiProperty({ description: 'ID du package', example: 1 })
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt() 
  @Min(1)
  packageId: number;
}
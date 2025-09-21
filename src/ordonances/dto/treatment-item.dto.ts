import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class TreatmentItemDto {
  
  @ApiProperty() @IsString() name: string;
  @ApiProperty() @IsString() dosage: string;
  @ApiProperty() @IsString() forme: string;
  @ApiProperty() @IsString() posologie: string;
  @ApiProperty() @IsString() duree: string;
  @ApiProperty() @IsString() voie: string;
}
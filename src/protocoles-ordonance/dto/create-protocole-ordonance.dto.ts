// src/protocoles-ordonance/dto/create-protocole-ordonance.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { TreatmentItemDto } from 'src/ordonances/dto/treatment-item.dto';

export class CreateProtocoleOrdonanceDto {
  @ApiProperty({ description: 'Nom de la maladie (ex: Paludisme)', maxLength: 255 })
  @IsString() @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ description: 'Description du protocole' })
  @IsOptional() @IsString() @MaxLength(500)
  description?: string;

  @ApiProperty({ type: [TreatmentItemDto], description: 'Traitement pré-rempli' })
  @IsArray() 
  // @ValidateNested({ each: true }) @Type(() => TreatmentItemDto)
  traitement: TreatmentItemDto[];

  @ApiPropertyOptional({ description: 'Images (URL ou base64)' })
  @IsOptional() @IsArray() @IsString({ each: true })
  images?: string[];
}

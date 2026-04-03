import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';
import { TypeMediaPublicite } from 'generated/prisma';

export class MediaPubliciteInputDto {
  @ApiProperty({
    enum: TypeMediaPublicite,
    example: TypeMediaPublicite.IMAGE,
  })
  @IsEnum(TypeMediaPublicite)
  typeMedia: TypeMediaPublicite;

  @ApiProperty({
    example: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...',
    description: 'Base64 ou URL',
  })
  @IsNotEmpty()
  @IsString()
  fichier: string;

  @ApiPropertyOptional({
    example: 20,
    description: 'Obligatoire si typeMedia = VIDEO, max 30',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(30)
  dureeSecondes?: number;
}
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayNotEmpty, IsArray, IsInt, Min } from 'class-validator';

export class CancelCandidatureDto {
  @ApiProperty({
    example: [1, 2, 3],
    description: 'Liste des IDs de candidatures à annuler',
    type: [Number],
  })
  @IsArray()
  @ArrayNotEmpty()
  @Type(() => Number)
  @IsInt({ each: true })
  @Min(1, { each: true })
  candidatureIds: number[];
}
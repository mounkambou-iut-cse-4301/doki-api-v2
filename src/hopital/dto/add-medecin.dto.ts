import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ArrayNotEmpty, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class AddMedecinsDto {
  @ApiProperty({ 
    example: [15, 23, 42],
    description: 'Liste des IDs des médecins à ajouter',
    type: [Number]
  })
  @IsArray()
  @ArrayNotEmpty()
  @Type(() => Number)
  @IsInt({ each: true })
  @Min(1, { each: true })
  medecinIds: number[];
}

export class RemoveMedecinsDto {
  @ApiProperty({ 
    example: [15, 23, 42],
    description: 'Liste des IDs des médecins à retirer',
    type: [Number]
  })
  @IsArray()
  @ArrayNotEmpty()
  @Type(() => Number)
  @IsInt({ each: true })
  @Min(1, { each: true })
  medecinIds: number[];
}
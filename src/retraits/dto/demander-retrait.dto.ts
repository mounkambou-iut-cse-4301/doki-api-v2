import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNumber, Min } from 'class-validator';

export class DemanderRetraitDto {
  @ApiProperty({
    example: 7,
    description: "ID du médecin ou de l'hôpital qui demande le retrait",
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  userId: number;

  @ApiProperty({
    example: 15000,
    description: 'Montant demandé',
  })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  montant: number;
}
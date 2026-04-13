import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateParametreRetraitDto {
  @ApiProperty({
    example: 7,
    description: "ID du médecin ou de l'hôpital qui paramètre son numéro de retrait",
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  userId: number;

  @ApiProperty({
    example: '677001122',
    description: 'Numéro de retrait à confirmer par OTP',
  })
  @IsNotEmpty()
  @IsString()
  numeroRetrait: string;

    @ApiProperty({
    example: 'Paul MEKA',
    description: 'Nom du titulaire du compte Mobile Money',
    required: false,
  })
  @IsOptional()
  @IsString()
  nomRetrait?: string;
}
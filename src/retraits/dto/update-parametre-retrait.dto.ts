import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateParametreRetraitDto {
  @ApiProperty({
    example: '699889900',
    description: 'Nouveau numéro de retrait à revalider par OTP',
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
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateParametreRetraitDto {
  @ApiProperty({
    example: '699889900',
    description: 'Nouveau numéro de retrait à revalider par OTP',
  })
  @IsNotEmpty()
  @IsString()
  numeroRetrait: string;
}
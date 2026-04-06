import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class VerifyRetraitOtpDto {
  @ApiProperty({
    example: '654321',
    description: 'OTP à 6 chiffres reçu par email pour confirmer le retrait',
  })
  @IsNotEmpty()
  @IsString()
  @Length(6, 6)
  otp: string;
}
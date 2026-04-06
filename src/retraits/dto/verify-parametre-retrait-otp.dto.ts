import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class VerifyParametreRetraitOtpDto {
  @ApiProperty({
    example: '123456',
    description: 'OTP à 6 chiffres reçu par email',
  })
  @IsNotEmpty()
  @IsString()
  @Length(6, 6)
  otp: string;
}
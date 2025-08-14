import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ConfirmResetDto {
  @ApiProperty({ description: 'Email du compte' })
  @IsNotEmpty() @IsEmail()
  email: string;

  @ApiProperty({ description: 'Code OTP reçu par email' })
  @IsNotEmpty() @IsString()
  otp: string;

  @ApiProperty({ description: 'Nouveau mot de passe (>= 8)' })
  @IsNotEmpty() @IsString() @MinLength(8)
  newPassword: string;
}
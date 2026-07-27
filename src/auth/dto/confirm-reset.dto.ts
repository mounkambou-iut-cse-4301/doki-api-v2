import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  MinLength,
} from 'class-validator';
import { UserType } from 'generated/prisma';

export class ConfirmResetDto {
  @ApiProperty({
    description: 'Email du compte',
    example: 'utilisateur@email.com',
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    description: "Type d'utilisateur du compte à réinitialiser",
    enum: UserType,
    example: UserType.PATIENT,
  })
  @IsNotEmpty()
  @IsEnum(UserType)
  userType: UserType;

  @ApiProperty({
    description: 'Code OTP reçu par email',
    example: '458921',
  })
  @IsNotEmpty()
  @IsString()
  otp: string;

  @ApiProperty({
    description: 'Nouveau mot de passe, au minimum 8 caractères',
    example: 'NouveauMotDePasse@2026',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  newPassword: string;
}
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty } from 'class-validator';
import { UserType } from 'generated/prisma';

export class RequestResetDto {
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
}
// login.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength, IsEnum } from 'class-validator';
import { UserType } from 'generated/prisma';

export class LoginDto {
  @ApiProperty({ description: 'Numéro de téléphone' })
  @IsNotEmpty() @IsString() @MaxLength(20)
  phone: string;

  @ApiProperty({ description: 'Mot de passe' })
  @IsNotEmpty() @IsString()
  password: string;

  @ApiProperty({ description: 'Type d\'utilisateur', enum: UserType })
  @IsNotEmpty() @IsEnum(UserType)
  userType: UserType;

  @ApiPropertyOptional({ description: 'entrer le expotoken' })
  @IsOptional() @IsString()
  expotoken: string;
}
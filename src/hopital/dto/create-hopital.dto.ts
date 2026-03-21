import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { Sex } from 'generated/prisma';

export class CreateHopitalDto {
  @ApiProperty({ example: 'Hôpital Central' })
  @IsNotEmpty()
  @IsString()
  firstName: string;

  @ApiPropertyOptional({ example: 'Yaoundé' })
  @IsOptional()
  @IsString()
  lastName: string;

  @ApiProperty({ enum: Sex, example: Sex.OTHER })
  @IsNotEmpty()
  sex: Sex;

  @ApiProperty({ example: 'contact@hopital-central.cm' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: '691234567' })
  @IsNotEmpty()
  @IsString()
  phone: string;

  @ApiProperty({ example: 'password123' })
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'Yaoundé' })
  @IsNotEmpty()
  @IsString()
  city: string;

  @ApiProperty({ example: 'Boulevard du 20 Mai' })
  @IsNotEmpty()
  @IsString()
  address: string;

  @ApiPropertyOptional({ example: 'https://res.cloudinary.com/.../logo.png' })
  @IsOptional()
  @IsString()
  profile: string;
}
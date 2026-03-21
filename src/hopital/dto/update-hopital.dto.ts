import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';
import { Sex } from 'generated/prisma';

export class UpdateHopitalDto {
  @ApiPropertyOptional({ example: 'Hôpital Central' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Yaoundé' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({ enum: Sex, example: Sex.OTHER })
  @IsOptional()
  sex?: Sex;

  @ApiPropertyOptional({ example: 'contact@hopital-central.cm' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '691234567' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'newpassword123' })
  @IsOptional()
  @MinLength(6)
  password?: string;

  @ApiPropertyOptional({ example: 'Douala' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 'Avenue Charles de Gaulle' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 'https://res.cloudinary.com/.../new-logo.png' })
  @IsOptional()
  @IsString()
  profile?: string;

  @ApiPropertyOptional({ example: 'Hôpital Central de Douala' })
  @IsOptional()
  @IsString()
  hospitalName?: string;
}
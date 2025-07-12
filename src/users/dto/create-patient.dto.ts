import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsString, IsEmail, MaxLength, IsEnum, IsOptional, IsBoolean, IsNumber } from 'class-validator';
import { Sex } from 'generated/prisma';

export class CreatePatientDto {
 @ApiProperty({ description: 'Prénom du patient', maxLength: 100 })
  @IsNotEmpty() @IsString() @MaxLength(100)
  firstName: string;

  @ApiProperty({ description: 'Nom du patient', maxLength: 100 })
  @IsNotEmpty() @IsString() @MaxLength(100)
  lastName: string;

  @ApiProperty({ enum: Sex })
  @IsEnum(Sex)
  sex: Sex;

  @ApiProperty({ description: 'Email', example: 'user@example.com' })
  @IsNotEmpty() @IsEmail()
  email: string;

  @ApiProperty({ description: 'Téléphone (unique)', example: '+237612345678' })
  @IsNotEmpty() @IsString() @MaxLength(20)
  phone: string;

  @ApiProperty({ description: 'Mot de passe' })
  @IsNotEmpty() @IsString()
  password: string;

  @ApiProperty({ description: 'Accepte la politique de confidentialité' })
  @IsBoolean()
  acceptPrivacy: boolean;

  // -------------------- Optionnels --------------------

  @ApiPropertyOptional({ description: 'Ville' })
  @IsOptional() @IsString()
  city?: string;

  @ApiPropertyOptional({ description: 'Adresse personnelle' })
  @IsOptional() @IsString()
  address?: string;

  @ApiPropertyOptional({ description: "Adresse de l'hôpital" })
  @IsOptional() @IsString()
  addressHospital?: string;

  @ApiPropertyOptional({ description: "Nom de l'hôpital" })
  @IsOptional() @IsString()
  hospitalName?: string;

  @ApiPropertyOptional({ description: 'Longitude', example: 9.12345678 })
  @IsOptional() @Type(() => Number) @IsNumber()
  longitude?: number;

  @ApiPropertyOptional({ description: 'Latitude', example: 4.12345678 })
  @IsOptional() @Type(() => Number) @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ description: 'Bio / profil libre' })
  @IsOptional() @IsString()
  profile?: string;

  @ApiPropertyOptional({ description: 'Poids (kg)', example: 70.5 })
  @IsOptional() @Type(() => Number) @IsNumber()
  weight?: number;


}

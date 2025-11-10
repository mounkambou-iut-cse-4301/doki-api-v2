import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ description: 'Numéro de téléphone' })
  @IsNotEmpty() @IsString() @MaxLength(20)
  phone: string;

  @ApiProperty({ description: 'Mot de passe' })
  @IsNotEmpty() @IsString()
  password: string;

    @ApiProperty({ description: 'entrer le expotoken' })
  @IsOptional() @IsString()
  expotoken: string;
}
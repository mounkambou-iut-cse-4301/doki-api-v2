import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ description: 'Numéro de téléphone' })
  @IsNotEmpty() @IsString() @MaxLength(20)
  phone: string;

  @ApiProperty({ description: 'Mot de passe' })
  @IsNotEmpty() @IsString()
  password: string;
}
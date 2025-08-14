import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ description: 'Ancien mot de passe' })
  @IsNotEmpty() @IsString()
  oldPassword: string;

  @ApiProperty({ description: 'Nouveau mot de passe (>= 8)' })
  @IsNotEmpty() @IsString() @MinLength(8)
  newPassword: string;
}
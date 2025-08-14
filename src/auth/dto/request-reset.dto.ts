import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class RequestResetDto {
  @ApiProperty({ description: 'Email du compte' })
  @IsNotEmpty() @IsEmail()
  email: string;
}
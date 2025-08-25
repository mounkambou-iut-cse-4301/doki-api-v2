import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';


export class SaveExpoTokenDto {
@ApiProperty({ description: 'Expo push token' })
@IsNotEmpty() @IsString() @MaxLength(255)
expotoken: string;

@ApiProperty({ description: 'user id' })
@IsNotEmpty()
userId: string;
}
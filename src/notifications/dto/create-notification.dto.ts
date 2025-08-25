import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';


export class CreateNotificationDto {
@ApiProperty({ description: 'Titre de la notification' })
@IsNotEmpty() @IsString()
title: string;


@ApiProperty({ description: 'Message de la notification' })
@IsNotEmpty() @IsString()
message: string;


@ApiProperty({ description: "ID de l'utilisateur destinataire" })
@IsInt() @Min(1)
userId: number;
}
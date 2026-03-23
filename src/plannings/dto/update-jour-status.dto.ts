import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsBoolean, IsString, IsIn } from 'class-validator';

export class UpdateJourStatusDto {
  @ApiProperty({ description: 'Jour de la semaine', enum: ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'] })
  @IsNotEmpty()
  @IsString()
  @IsIn(['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'])
  jour: string;

  @ApiProperty({ description: 'Ce jour est-il off (fermé) ?' })
  @IsNotEmpty()
  @IsBoolean()
  isOff: boolean;
}
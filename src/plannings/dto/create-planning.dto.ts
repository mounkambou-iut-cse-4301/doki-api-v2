// src/planning/dto/create-planning.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsBoolean, IsInt } from 'class-validator';

export class CreatePlanningDto {
  @ApiProperty({ description: 'Heure de début (HH:MM:SS)' })
  @IsNotEmpty() @IsString()
  debutHour: string;

  @ApiProperty({ description: 'Heure de fin (HH:MM:SS)' })
  @IsNotEmpty() @IsString()
  endHour: string;

  @ApiProperty({ description: 'Ouvert le lundi?' })
  @IsNotEmpty() @IsBoolean()
  lundi: boolean;

  @ApiProperty({ description: 'Ouvert le mardi?' })
  @IsNotEmpty() @IsBoolean()
  mardi: boolean;

  @ApiProperty({ description: 'Ouvert le mercredi?' })
  @IsNotEmpty() @IsBoolean()
  mercredi: boolean;

  @ApiProperty({ description: 'Ouvert le jeudi?' })
  @IsNotEmpty() @IsBoolean()
  jeudi: boolean;

  @ApiProperty({ description: 'Ouvert le vendredi?' })
  @IsNotEmpty() @IsBoolean()
  vendredi: boolean;

  @ApiProperty({ description: 'Ouvert le samedi?' })
  @IsNotEmpty() @IsBoolean()
  samedi: boolean;

  @ApiProperty({ description: 'Ouvert le dimanche?' })
  @IsNotEmpty() @IsBoolean()
  dimanche: boolean;

  @ApiProperty({ description: 'Planning fermé ce jour?' })
  @IsNotEmpty() @IsBoolean()
  isClosed: boolean;

  @ApiProperty({ description: 'ID du médecin' })
  @IsNotEmpty() @IsInt()
  medecinId: number;
}

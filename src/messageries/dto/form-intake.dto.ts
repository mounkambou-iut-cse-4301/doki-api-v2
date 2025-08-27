import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsOptional, IsString } from 'class-validator';

export class FormIntakeDto {
  @ApiPropertyOptional({ description: 'Nom et prénom' })
  @IsOptional() @IsString()
  nomPrenom?: string;

  @ApiPropertyOptional({ description: 'Localisation' })
  @IsOptional() @IsString()
  localisation?: string;

  @ApiPropertyOptional({ description: 'Quand les symptômes ont commencé ?' })
  @IsOptional() @IsString()
  debutSymptomes?: string;

  @ApiPropertyOptional({ description: 'Facteurs améliorants/aggravants' })
  @IsOptional() @IsString()
  facteursAmeliorantsAggravants?: string;

  @ApiPropertyOptional({ description: 'Comorbidités (ex: diabète, AVC...)', type: [String] })
  @IsOptional() @IsArray()
  comorbidites?: string[];

  @ApiPropertyOptional({ description: 'Fumez-vous ?' })
  @IsOptional() @IsBoolean()
  fume?: boolean;

  @ApiPropertyOptional({ description: 'Exercice régulier ?' })
  @IsOptional() @IsBoolean()
  exerciceRegulier?: boolean;
}

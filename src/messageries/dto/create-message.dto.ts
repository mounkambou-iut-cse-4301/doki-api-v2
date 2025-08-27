import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Min, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';
import { FormIntakeDto } from './form-intake.dto';

export class CreateMessageDto {
  @ApiProperty({ description: 'ID du médecin' })
  @IsInt() @Min(1)
  medecinId: number;

  @ApiProperty({ description: 'ID du patient' })
  @IsInt() @Min(1)
  patientId: number;

  @ApiPropertyOptional({ description: 'Contenu texte (optionnel)' })
  @IsOptional() @IsString() @MaxLength(5000)
  content?: string;

  @ApiPropertyOptional({ description: 'Fiche structurée (optionnel)', type: FormIntakeDto })
  @IsOptional() @ValidateNested() @Type(() => FormIntakeDto)
  form?: FormIntakeDto;
}

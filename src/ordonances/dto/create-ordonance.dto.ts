import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsArray, ValidateNested, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateSuiviDto } from 'src/suivis/dto/create-suivi.dto';

// DTO pour créer une nouvelle ordonnance
export class CreateOrdonanceDto {
  @ApiProperty({ description: 'ID de la réservation associée à cette ordonnance.' })
  @IsInt()
  reservationId: number; // ID de la réservation.

  @ApiProperty({ description: 'ID du médecin qui prescrit l’ordonnance.' })
  @IsInt()
  medecinId: number; // ID du médecin prescripteur.

  @ApiProperty({ description: 'ID du patient concerné par l’ordonnance.' })
  @IsInt()
  patientId: number; // ID du patient.

  @ApiPropertyOptional({ description: "Nom de l'ordonnance pour identification." })
  @IsOptional() 
  @IsString() 
  name?: string; // Nom de l’ordonnance.

  @ApiPropertyOptional({ description: 'Durée du traitement en jours ou en semaines.' })
  @IsOptional() 
  @IsString() 
  dureeTraitement?: string; // Durée du traitement.

  @ApiProperty({ type: [CreateSuiviDto], description: 'Liste des traitements associés à cette ordonnance.' }) // Using the same structure
  @IsArray() 
  @ValidateNested({ each: true }) 
  @Type(() => CreateSuiviDto) 
  traitement: CreateSuiviDto[]; // Liste des traitements.

  @ApiPropertyOptional({ description: 'Commentaire facultatif pour l’ordonnance.' })
  @IsOptional() 
  @IsString() 
  comment?: string; // Commentaires ou notes supplémentaires.

  @ApiPropertyOptional({ description: 'Liste optionnelle d’URLs d’images associées.' })
  @IsOptional() 
  @IsArray() 
  @IsString({ each: true }) 
  images?: string[]; // Images associées.
}
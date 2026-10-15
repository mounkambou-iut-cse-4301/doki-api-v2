import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsArray, ValidateNested, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { OrdonanceTreatmentDto } from './ordonance-treatment.dto';

// DTO pour créer une nouvelle ordonnance
export class CreateOrdonanceDto {
  @ApiProperty({ description: 'ID de la réservation existante. Une seule ordonnance par réservation.', example: 30 })
  @IsInt()
  reservationId: number; // ID de la réservation.

  @ApiProperty({ description: 'ID du médecin qui prescrit l’ordonnance.', example: 10 })
  @IsInt()
  medecinId: number; // ID du médecin prescripteur.

  @ApiProperty({ description: 'ID du patient destinataire, fourni uniquement ici. Tous les suivis créés sont rattachés à ce patient.', example: 20 })
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

  @ApiProperty({ type: [OrdonanceTreatmentDto], minItems: 1, description: 'Au moins un traitement saisi manuellement ou copié depuis item.traitement d’un protocole. Chaque élément doit inclure name, dosage, forme, voie, posologie, instructions, startDate, endDate, frequency, notificationTimes et isActive. Ne pas fournir patientId dans les traitements : un suivi est créé pour chaque élément actif avec le patientId principal.' })
  @IsArray() 
  @ValidateNested({ each: true }) 
  @Type(() => OrdonanceTreatmentDto)
  traitement: OrdonanceTreatmentDto[]; // Liste des traitements.

  @ApiPropertyOptional({ description: 'Commentaire facultatif pour l’ordonnance.' })
  @IsOptional() 
  @IsString() 
  comment?: string; // Commentaires ou notes supplémentaires.

  @ApiPropertyOptional({ type: [String], description: 'Pièces jointes : URL HTTP(S) conservées telles quelles ou Data URL image/PDF envoyées sur Cloudinary. Exemple : data:image/png;base64,... ou data:application/pdf;base64,... . Les pièces jointes ne remplacent pas les traitements.', example: ['https://example.com/ordonnance.png'] })
  @IsOptional() 
  @IsArray() 
  @IsString({ each: true }) 
  images?: string[]; // Images associées.
}

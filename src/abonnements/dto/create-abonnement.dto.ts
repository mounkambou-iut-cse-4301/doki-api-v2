import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min, IsPositive, IsNumber } from 'class-validator';

export class CreateAbonnementDto {
  @ApiProperty({ description: 'ID du médecin' })
  @IsInt() @Min(1)
  medecinId: number;

  @ApiProperty({ description: 'ID du patient' })
  @IsInt() @Min(1)
  patientId: number;

  @ApiProperty({ description: 'Durée de l\'abonnement en mois', example: 1 })
  @IsInt() @Min(1)
  months: number;

  @ApiProperty({ description: 'Montant de l\'abonnement', example: 5000 })
  @IsNumber() @IsPositive()
  amount: number;

  @ApiProperty({ description: 'Nombre de fois que le plan de réservation est utilisé', example: 1 })
  @IsInt() @Min(1)
  numberOfTimePlanReservation: number;
}
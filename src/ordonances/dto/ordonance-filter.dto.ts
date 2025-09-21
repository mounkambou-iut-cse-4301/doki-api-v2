import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString } from 'class-validator';

export class OrdonanceFilterDto {

      @ApiPropertyOptional({ description: 'Recherche (durée traitement, commentaire, noms liés)' })
      @IsOptional() @IsString()
      q?: string;
    @ApiPropertyOptional({ description: 'ID du médecin' })
    @IsOptional()
    @IsInt()
    medecinId?: number;

    @ApiPropertyOptional({ description: 'ID du patient' })
    @IsOptional()
    @IsInt()
    patientId?: number;

    @ApiPropertyOptional({ description: 'ID de la réservation' })
    @IsOptional()
    @IsInt()
    reservationId?: number;

    @ApiPropertyOptional({ description: 'Date de création (YYYY-MM-DD)' })
    @IsOptional()
    @IsString()
    createdAt?: string;

    @ApiPropertyOptional({ description: 'Durée de traitement' })
    @IsOptional()
    @IsString()
    dureeTraitement?: string;

    @ApiPropertyOptional({ description: 'Commentaire' })
    @IsOptional()
    @IsString()
    comment?: string;

    @ApiPropertyOptional({ description: 'Page number', default: 1 })
    @IsOptional()
    @IsInt()
    page?: number;

    @ApiPropertyOptional({ description: 'Number of items per page', default: 10 })
    @IsOptional()
    @IsInt()
    limit?: number;

    
}
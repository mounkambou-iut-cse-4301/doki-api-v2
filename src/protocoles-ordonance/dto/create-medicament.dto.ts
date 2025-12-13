import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateMedicamentDto {
  @ApiProperty({
    description: 'Nom du médicament',
    example: 'Paracétamol',
  })
  @IsString()
  name: string;

    @ApiPropertyOptional({ description: 'Nom commercial de la maladie', maxLength: 255 })
    @IsOptional() @IsString() 
    nameCommercial?: string;
  
    @ApiPropertyOptional({ description: 'Nom du laboratoire', maxLength: 255 })
    @IsOptional() @IsString() 
    nameLabo?: string;

  @ApiPropertyOptional({
    description: 'Dosage (ex: 500mg)',
    example: '500mg',
  })
  @IsOptional()
  @IsString()
  dosage?: string;

  @ApiPropertyOptional({
    description: 'Forme galénique (comprimé, gélule, sirop...)',
    example: 'comprimé',
  })
  @IsOptional()
  @IsString()
  forme?: string;

  @ApiPropertyOptional({
    description: "Voie d'administration (orale, IV, IM...)",
    example: 'orale',
  })
  @IsOptional()
  @IsString()
  voie?: string;

  @ApiPropertyOptional({
    description: 'Posologie détaillée',
    example: '1 comprimé 3 fois par jour',
  })
  @IsOptional()
  @IsString()
  posologie?: string;

  @ApiPropertyOptional({
    description: 'Commentaire / notes',
    example: 'À éviter chez la femme enceinte',
  })
  @IsOptional()
  @IsString()
  comment?: string;
}

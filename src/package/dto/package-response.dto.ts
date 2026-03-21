import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform, Type } from 'class-transformer';

export class SpecialitySimpleDto {
  @ApiProperty({ example: 1 })
  @Expose()
  specialityId: number;

  @ApiProperty({ example: 'Cardiologie' })
  @Expose()
  name: string;

  @ApiProperty({ example: 5000 })
  @Expose()
  consultationPrice: number;
}

export class PackageResponseDto {
  @ApiProperty({ example: 1 })
  @Expose()
  packageId: number;

  @ApiProperty({ example: 'Pack Cardiologie Premium' })
  @Expose()
  nom: string;

  @ApiProperty({ example: 1 })
  @Expose()
  specialityId: number;

  @ApiProperty({ example: 5 })
  @Expose()
  nombreConsultations: number;

  @ApiProperty({ example: true })
  @Expose()
  chatInclus: boolean;

  @ApiProperty({ example: true })
  @Expose()
  appelInclus: boolean;

  @ApiProperty({ example: 25000 })
  @Expose()
  @Transform(({ value }) => Number(value))
  prix: number;

  @ApiProperty({ example: 30 })
  @Expose()
  dureeValiditeJours: number;

  @ApiProperty({ example: true })
  @Expose()
  isActive: boolean;

  @ApiProperty({ example: '2026-03-21T10:00:00.000Z' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ example: '2026-03-21T10:00:00.000Z' })
  @Expose()
  updatedAt: Date;

  @ApiPropertyOptional({ type: SpecialitySimpleDto })
  @Expose()
  @Type(() => SpecialitySimpleDto)
  speciality?: SpecialitySimpleDto;

  @ApiPropertyOptional({ example: 12 })
  @Expose()
  @Transform(({ obj }) => obj.abonnements?.length || 0)
  nombreAbonnements?: number;

  @ApiProperty({ example: '25 000 FCFA' })
  @Expose()
  @Transform(({ value }) => `${Number(value).toLocaleString('fr-FR')} FCFA`)
  prixFormatted: string;

  @ApiProperty({ example: 'Actif' })
  @Expose()
  @Transform(({ obj }) => obj.isActive ? 'Actif' : 'Inactif')
  statutLibelle: string;

  @ApiProperty({ example: '5 consultations, chat inclus, appel inclus' })
  @Expose()
  @Transform(({ obj }) => {
    const services: string[] = [];  // ✅ Typage explicite
    if (obj.chatInclus) services.push('chat inclus');
    if (obj.appelInclus) services.push('appel inclus');
    return `${obj.nombreConsultations} consultations${services.length ? `, ${services.join(', ')}` : ''}`;
  })
  description: string;
}

export class PackagePaginatedResponseDto {
  @ApiProperty({ example: 'Liste des packages récupérée avec succès' })
  message: string;

  @ApiProperty({ example: 'Packages list retrieved successfully' })
  messageE: string;

  @ApiProperty({ type: [PackageResponseDto] })
  @Type(() => PackageResponseDto)
  data: PackageResponseDto[];

  @ApiProperty({
    example: {
      total: 10,
      page: 1,
      limit: 20,
      pageCount: 1
    }
  })
  meta: {
    total: number;
    page: number;
    limit: number;
    pageCount: number;
  };
}
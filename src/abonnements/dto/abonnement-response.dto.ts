import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform, Type } from 'class-transformer';

export class SpecialitySimpleDto {
  @ApiProperty({ example: 1 })
  @Expose()
  specialityId: number;

  @ApiProperty({ example: 'Cardiologie' })
  @Expose()
  name: string;
}

export class PackageSimpleDto {
  @ApiProperty({ example: 1 })
  @Expose()
  packageId: number;

  @ApiProperty({ example: 'Pack Cardiologie Premium' })
  @Expose()
  nom: string;

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

  @ApiPropertyOptional({ type: SpecialitySimpleDto })
  @Expose()
  @Type(() => SpecialitySimpleDto)
  speciality?: SpecialitySimpleDto;
}

export class PatientSimpleDto {
  @ApiProperty({ example: 1 })
  @Expose()
  userId: number;

  @ApiProperty({ example: 'Jean' })
  @Expose()
  firstName: string;

  @ApiProperty({ example: 'Dupont' })
  @Expose()
  lastName: string;

  @ApiProperty({ example: 'jean@example.com' })
  @Expose()
  email: string;

  @ApiPropertyOptional({ example: 'https://...' })
  @Expose()
  profile?: string;
}

export class AbonnementResponseDto {
  @ApiProperty({ example: 1 })
  @Expose()
  abonnementId: number;

  @ApiProperty({ example: 5 })
  @Expose()
  patientId: number;

  @ApiPropertyOptional({ example: 1 })
  @Expose()
  packageId?: number;

  @ApiProperty({ example: 5 })
  @Expose()
  numberOfTimePlanReservation: number;

  @ApiProperty({ enum: ['PENDING', 'CONFIRMED'], example: 'CONFIRMED' })
  @Expose()
  status: string;

  @ApiProperty({ example: '2026-03-25T00:00:00.000Z' })
  @Expose()
  debutDate: Date;

  @ApiProperty({ example: '2026-04-24T00:00:00.000Z' })
  @Expose()
  endDate: Date;

  @ApiPropertyOptional({ example: 25000 })
  @Expose()
  @Transform(({ value }) => value ? Number(value) : null)
  amount?: number;

  @ApiPropertyOptional({ example: 1 })
  @Expose()
  transactionId?: number;

  @ApiProperty({ example: '2026-03-25T10:30:00.000Z' })
  @Expose()
  createdAt: Date;

  @ApiPropertyOptional({ type: PackageSimpleDto })
  @Expose()
  @Type(() => PackageSimpleDto)
  package?: PackageSimpleDto;

  @ApiPropertyOptional({ type: PatientSimpleDto })
  @Expose()
  @Type(() => PatientSimpleDto)
  patient?: PatientSimpleDto;

  @ApiProperty({ description: 'Statut actif de l\'abonnement', example: true })
  @Expose()
  @Transform(({ obj }) => {
    if (obj.status !== 'CONFIRMED') return false;
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const endDate = new Date(obj.endDate);
    endDate.setUTCHours(0, 0, 0, 0);
    return endDate >= today;
  })
  isActive: boolean;

  @ApiProperty({ description: 'Nombre de consultations restantes', example: 3 })
  @Expose()
  consultationsRestantes: number;

  @ApiProperty({ description: 'Jours restants avant expiration', example: 30 })
  @Expose()
  @Transform(({ obj }) => {
    if (obj.status !== 'CONFIRMED') return 0;
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const endDate = new Date(obj.endDate);
    endDate.setUTCHours(0, 0, 0, 0);
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  })
  joursRestants: number;

  @ApiProperty({ description: 'Prix formaté', example: '25 000 FCFA' })
  @Expose()
  @Transform(({ obj }) => obj.amount ? `${Number(obj.amount).toLocaleString('fr-FR')} FCFA` : '0 FCFA')
  amountFormatted: string;
}

export class AbonnementPaginatedResponseDto {
  @ApiProperty({ example: 'Abonnements récupérés avec succès' })
  message: string;

  @ApiProperty({ example: 'Subscriptions retrieved successfully' })
  messageE: string;

  @ApiProperty({ type: [AbonnementResponseDto] })
  @Type(() => AbonnementResponseDto)
  data: AbonnementResponseDto[];

  @ApiProperty({
    example: {
      total: 10,
      page: 1,
      limit: 10,
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
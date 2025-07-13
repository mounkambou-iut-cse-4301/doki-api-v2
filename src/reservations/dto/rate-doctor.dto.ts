// src/reservations/dto/rate-doctor.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, Min, Max, IsOptional, IsString } from 'class-validator';

export class RateDoctorDto {
  @ApiProperty({ description: 'ID du médecin' })
  @IsInt()
  medecinId: number;

  @ApiProperty({ description: 'ID du patient' })
  @IsInt()
  patientId: number;

  @ApiProperty({ description: 'Note (1–5)', minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  note: number;

  @ApiPropertyOptional({ description: 'Commentaire' })
  @IsOptional()
  @IsString()
  comment?: string;
}

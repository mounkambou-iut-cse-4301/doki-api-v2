import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { CibleAudiencePublicite } from 'generated/prisma';

export class PubliciteQueryDto {
  @ApiPropertyOptional({ example: 'campagne' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    enum: CibleAudiencePublicite,
    description:
      'Permet de récupérer les pubs pour MEDECIN, PATIENT ou LES_DEUX',
  })
  @IsOptional()
  @IsEnum(CibleAudiencePublicite)
  cibleAudience?: CibleAudiencePublicite;

  @ApiPropertyOptional({example:1})
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  annonceurUtilisateurId?: number;

   @ApiPropertyOptional({example:1})
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  televerseParId?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, Min, IsOptional, IsString } from 'class-validator';

export class SendDmMessageDto {
  @ApiProperty({ description: 'Médecin participant' }) @IsInt() @Min(1)
  medecinId: number;

  @ApiProperty({ description: 'Patient participant' }) @IsInt() @Min(1)
  patientId: number;

  @ApiProperty({ description: 'Expéditeur (médecin OU patient)' }) @IsInt() @Min(1)
  senderId: number;

  @ApiPropertyOptional({ description: 'Texte du message' })
  @IsOptional() @IsString()
  content?: string;

  @ApiPropertyOptional({ description: 'Métadonnées/attachments (JSON libre)', type: 'object', additionalProperties: true })
  @IsOptional()
  meta?: Record<string, any>;
}

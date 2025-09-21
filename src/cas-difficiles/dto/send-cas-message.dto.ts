import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class SendCasMessageDto {
  @ApiProperty() @IsInt() @Min(1)
  senderId: number; // médecin

  @ApiPropertyOptional() @IsOptional() @IsString()
  content?: string;

  @ApiPropertyOptional({ description: 'Objet libre (JSON)' })
  @IsOptional()
  meta?: Record<string, any>;

  @ApiPropertyOptional({ default: false })
  @IsOptional() @IsBoolean()
  anonymous?: boolean;
}

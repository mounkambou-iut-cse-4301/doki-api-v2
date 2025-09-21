import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class SendFicheRequestDto {
  @ApiProperty() @IsInt() @Min(1)
  conversationId: number;

  @ApiProperty() @IsInt() @Min(1)
  ficheId: number;

  @ApiProperty({ description: 'Médecin qui envoie la demande' })
  @IsInt() @Min(1)
  senderId: number;
}

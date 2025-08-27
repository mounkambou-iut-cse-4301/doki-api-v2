import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';
import { CreateMessageDto } from './create-message.dto';

export class SendMessageDto extends CreateMessageDto {
  @ApiProperty({ description: 'ID de l’expéditeur (patient OU médecin)' })
  @IsInt() @Min(1)
  senderId: number;
}

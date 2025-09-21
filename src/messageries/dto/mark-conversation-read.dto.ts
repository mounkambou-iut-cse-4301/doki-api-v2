import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class MarkConversationReadDto {
  @ApiProperty({ description: 'ID du lecteur' })
  @IsInt() @Min(1)
  readerId: number;
}

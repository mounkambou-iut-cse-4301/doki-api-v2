import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class MarkCasReadDto {
  @ApiProperty() @IsInt() @Min(1)
  readerId: number; // médecin
}

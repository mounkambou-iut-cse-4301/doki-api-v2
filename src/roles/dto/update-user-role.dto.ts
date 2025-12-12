import { ApiProperty } from '@nestjs/swagger';
import { IsInt } from 'class-validator';

export class UpdateUserRoleDto {
  @ApiProperty({
    example: 1,
    description: 'ID du rôle à attribuer ou retirer',
  })
  @IsInt()
  roleId: number;
}

import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsInt, Min } from 'class-validator';

export class AssignRolePermissionsDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  roleId: number;

  @ApiProperty({ example: [1, 2, 3] })
  @IsArray()
  @ArrayMinSize(1)
  permissionIds: number[];
}

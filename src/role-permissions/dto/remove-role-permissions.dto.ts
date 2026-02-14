import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsInt, Min } from 'class-validator';

export class RemoveRolePermissionsDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  roleId: number;

  @ApiProperty({ example: [1, 2] })
  @IsArray()
  @ArrayMinSize(1)
  permissionIds: number[];
}

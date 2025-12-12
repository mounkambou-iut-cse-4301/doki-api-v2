import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEmail, IsEnum, IsInt, IsOptional, IsString, MinLength } from 'class-validator';
import { Sex } from 'generated/prisma';

export class CreateAdminDto {
  @ApiProperty()
  @IsString()
  firstName: string;

  @ApiProperty()
  @IsString()
  lastName: string;

  @ApiProperty({ enum: Sex })
  @IsEnum(Sex)
  sex: Sex;

  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  phone: string;

  @ApiProperty({ minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({
    description: 'true si SUPERADMIN, false/undefined => ADMIN',
    default: false,
  })
  @IsOptional()
  isSuperAdmin?: boolean;

  @ApiPropertyOptional({
    type: [Number],
    example: [1, 2, 3],
    description: 'Liste des roleId à attribuer à la création',
  })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  roleIds?: number[];
}

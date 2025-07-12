import { PartialType } from '@nestjs/swagger';
import { CreateSpecialityDto } from './create-specialityDto';

export class UpdateSpecialityDto extends PartialType(CreateSpecialityDto) {}

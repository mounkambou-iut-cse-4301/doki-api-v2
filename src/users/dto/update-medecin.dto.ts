import { PartialType } from '@nestjs/swagger';
import { CreateMedecinDto } from './create-medecin.dto';

export class UpdateMedecinDto extends PartialType(CreateMedecinDto) {}

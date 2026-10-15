import { OmitType } from '@nestjs/swagger';
import { CreateSuiviDto } from 'src/suivis/dto/create-suivi.dto';

// Le patient et l'ordonnance sont déterminés par le serveur pour tous les suivis.
export class OrdonanceTreatmentDto extends OmitType(CreateSuiviDto, [
  'patientId',
  'ordonanceId',
] as const) {}

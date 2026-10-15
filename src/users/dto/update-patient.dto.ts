import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { CreatePatientDto } from './create-patient.dto';

export class UpdatePatientDto extends PartialType(CreatePatientDto) {
  @ApiPropertyOptional({
    description:
      'Photo de profil : image base64 (brut ou data:image/...;base64,...) envoyée sur Cloudinary, ou URL HTTPS conservée telle quelle. Null, vide ou absent : photo inchangée.',
    example: 'https://res.cloudinary.com/demo/image/upload/profile.png',
    nullable: true,
  })
  profile?: string;
}

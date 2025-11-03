import { PartialType } from '@nestjs/swagger';
import { CreateCategoryVideoDto } from './create-category-video.dto';

export class UpdateCategoryVideoDto extends PartialType(CreateCategoryVideoDto) {}

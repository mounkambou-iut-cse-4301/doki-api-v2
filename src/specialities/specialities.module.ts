import { Module } from '@nestjs/common';
import { SpecialitiesController } from './specialities.controller';
import { SpecialitiesService } from './specialities.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],   
  controllers: [SpecialitiesController],
  providers: [SpecialitiesService]
})
export class SpecialitiesModule {}

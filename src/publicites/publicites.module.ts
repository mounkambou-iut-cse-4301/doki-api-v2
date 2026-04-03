import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { PublicitesController } from './publicites.controller';
import { PublicitesService } from './publicites.service';

@Module({
  controllers: [PublicitesController],
  providers: [PublicitesService, PrismaService],
  exports: [PublicitesService],
})
export class PublicitesModule {}
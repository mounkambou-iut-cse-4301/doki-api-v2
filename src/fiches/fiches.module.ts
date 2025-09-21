import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { FichesController } from './fiches.controller';
import { FichesService } from './fiches.service';

@Module({
  controllers: [FichesController],
  providers: [PrismaService, FichesService],
  exports: [FichesService],
})
export class FichesModule {}

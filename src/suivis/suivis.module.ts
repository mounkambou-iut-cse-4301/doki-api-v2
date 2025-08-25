import { Module } from '@nestjs/common';
import { SuivisController } from './suivis.controller';
import { SuivisService } from './suivis.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [SuivisController],
  providers: [SuivisService, PrismaService],
})
export class SuivisModule {}
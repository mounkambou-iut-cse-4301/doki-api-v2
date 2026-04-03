import { Module } from '@nestjs/common';
import { CandidatureController } from './candidature.controller';
import { CandidatureService } from './candidature.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [CandidatureController],
  providers: [CandidatureService, PrismaService],
  exports: [CandidatureService],
})
export class CandidatureModule {}
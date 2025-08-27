// ============================
// src/messageries/messageries.module.ts
// ============================
import { Module } from '@nestjs/common';
import { MessageriesController } from './messageries.controller';
import { MessageriesService } from './messageries.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [MessageriesController],
  providers: [MessageriesService, PrismaService],
})
export class MessageriesModule {}
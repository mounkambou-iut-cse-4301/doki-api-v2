import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CasDifficilesController } from './cas-difficiles.controller';
import { CasDifficilesService } from './cas-difficiles.service';

@Module({
  controllers: [CasDifficilesController],
  providers: [PrismaService, CasDifficilesService],
  exports: [CasDifficilesService],
})
export class CasDifficilesModule {}

import { Module } from '@nestjs/common';
import { HopitalController } from './hopital.controller';
import { HopitalService } from './hopital.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [HopitalController],
  providers: [HopitalService],
  exports: [HopitalService],
})
export class HopitalModule {}
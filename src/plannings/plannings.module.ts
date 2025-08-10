import { Module } from '@nestjs/common';
import { PlanningsController } from './plannings.controller';
import { PlanningsService } from './plannings.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],   
  controllers: [PlanningsController],
  providers: [PlanningsService]
})
export class PlanningsModule {}

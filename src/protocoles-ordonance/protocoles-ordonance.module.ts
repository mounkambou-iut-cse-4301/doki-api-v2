import { Module } from '@nestjs/common';
import { ProtocolesOrdonanceController } from './protocoles-ordonance.controller';
import { ProtocolesOrdonanceService } from './protocoles-ordonance.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
            imports: [PrismaModule],   
  
  controllers: [ProtocolesOrdonanceController],
  providers: [ProtocolesOrdonanceService]
})
export class ProtocolesOrdonanceModule {}

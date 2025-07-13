import { Module } from '@nestjs/common';
import { ReservationsController } from './reservations.controller';
import { ReservationsService } from './reservations.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
      imports: [PrismaModule],   
  
  controllers: [ReservationsController],
  providers: [ReservationsService]
})
export class ReservationsModule {}

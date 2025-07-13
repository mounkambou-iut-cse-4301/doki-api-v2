import { Module } from '@nestjs/common';
import { SpecialitiesModule } from './specialities/specialities.module';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { ReservationsModule } from './reservations/reservations.module';
import { PlanningsModule } from './plannings/plannings.module';


@Module({
  imports: [ConfigModule.forRoot({isGlobal:true}), SpecialitiesModule, PrismaModule, UsersModule, ReservationsModule, PlanningsModule],
})
export class AppModule {}

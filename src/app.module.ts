import { Module } from '@nestjs/common';
import { SpecialitiesModule } from './specialities/specialities.module';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { ReservationsModule } from './reservations/reservations.module';


@Module({
  imports: [ConfigModule.forRoot({isGlobal:true}), SpecialitiesModule, PrismaModule, UsersModule, ReservationsModule],
})
export class AppModule {}

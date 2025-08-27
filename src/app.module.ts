import { Module } from '@nestjs/common';
import { SpecialitiesModule } from './specialities/specialities.module';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { ReservationsModule } from './reservations/reservations.module';
import { PlanningsModule } from './plannings/plannings.module';
import { OrdonancesModule } from './ordonances/ordonances.module';
import { AbonnementsModule } from './abonnements/abonnements.module';
import { VideosModule } from './videos/videos.module';
import { AdminsModule } from './admins/admins.module';
import { AuthModule } from './auth/auth.module';
import { NotificationsModule } from './notifications/notifications.module';
import { SuivisModule } from './suivis/suivis.module';
import { MessageriesModule } from './messageries/messageries.module';


@Module({
  imports: [ConfigModule.forRoot({isGlobal:true}), SpecialitiesModule, PrismaModule, UsersModule, ReservationsModule, PlanningsModule, OrdonancesModule, AbonnementsModule, VideosModule, AdminsModule, AuthModule, NotificationsModule, SuivisModule, MessageriesModule],
})
export class AppModule {}

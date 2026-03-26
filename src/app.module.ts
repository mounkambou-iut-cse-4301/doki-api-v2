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
import { CategoriesModule } from './categories/categories.module';
import { FormationsModule } from './formations/formations.module';
import { FichesModule } from './fiches/fiches.module';
import { CasDifficilesModule } from './cas-difficiles/cas-difficiles.module';
import { CategoryVideosModule } from './category-videos/category-videos.module';
import { ProtocolesOrdonanceModule } from './protocoles-ordonance/protocoles-ordonance.module';
import { StatsModule } from './stats/stats.module';
import { AiModule } from './ai/ai.module';
import { PermissionsModule } from './permissions/permissions.module';
import { RolePermissionsModule } from './role-permissions/role-permissions.module';
import { RolesModule } from './roles/roles.module';
import { HopitalModule } from './hopital/hopital.module';
import { PackageModule } from './package/package.module';
import { SettingsModule } from './settings/settings.module';


@Module({
  imports: [ConfigModule.forRoot({isGlobal:true}),RolesModule, SpecialitiesModule, PrismaModule, UsersModule, ReservationsModule, PlanningsModule, OrdonancesModule, AbonnementsModule, VideosModule, AdminsModule, AuthModule, NotificationsModule, SuivisModule, MessageriesModule, CategoriesModule, FormationsModule, FichesModule, CasDifficilesModule, CategoryVideosModule, ProtocolesOrdonanceModule, StatsModule, AiModule, PermissionsModule, RolePermissionsModule, HopitalModule, PackageModule, SettingsModule],
})
export class AppModule {}

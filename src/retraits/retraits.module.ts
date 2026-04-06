import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';
import { RetraitsController } from './retraits.controller';
import { RetraitsService } from './retraits.service';
import { EmailService } from 'src/utils/email.service';

@Module({
  imports: [ConfigModule],
  controllers: [RetraitsController],
  providers: [RetraitsService, PrismaService, EmailService],
  exports: [RetraitsService],
})
export class RetraitsModule {}
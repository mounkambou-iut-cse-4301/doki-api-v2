// import { Injectable } from '@nestjs/common';
// import { ConfigService } from '@nestjs/config';
// import { PrismaClient } from 'generated/prisma';

// @Injectable()
// export class PrismaService extends PrismaClient {
//     constructor(configService:ConfigService){
//         super({
//             datasources:{
//                 db:{
//                     url:configService.get('DATABASE_URL')
//                 }
//             }
//         })
//     }
// }

// src/prisma/prisma.service.ts
import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from 'generated/prisma';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor(private readonly config: ConfigService) {
    super({
      datasources: {
        db: {
          url: config.get<string>('DATABASE_URL'),
        },
      },
      log: [
        { level: 'warn', emit: 'event' },
        { level: 'error', emit: 'event' },
      ],
    });

    (this as any).$on('warn', (e: any) => this.logger.warn(e));
    (this as any).$on('error', (e: any) => this.logger.error(e));
  }

  private async connectWithRetry(
    attempts = Number(this.config.get('PRISMA_RETRY_ATTEMPTS') ?? 20),
    baseDelayMs = Number(this.config.get('PRISMA_RETRY_BASE_DELAY_MS') ?? 1000),
    maxDelayMs = Number(this.config.get('PRISMA_RETRY_MAX_DELAY_MS') ?? 30000),
  ) {
    for (let i = 1; i <= attempts; i++) {
      try {
        this.logger.log(`Prisma connect attempt ${i}/${attempts}…`);
        await this.$connect();
        this.logger.log('Prisma connected ✅');
        return;
      } catch (err: any) {
        this.logger.error(`Prisma connect failed (attempt ${i}): ${err?.message ?? err}`);
        if (i === attempts) throw err;
        const jitter = Math.floor(Math.random() * 500);
        const delay = Math.min(baseDelayMs * 2 ** (i - 1), maxDelayMs) + jitter;
        this.logger.log(`Retrying Prisma in ${delay}ms…`);
        await sleep(delay);
      }
    }
  }

  async onModuleInit() {
    await this.connectWithRetry();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}

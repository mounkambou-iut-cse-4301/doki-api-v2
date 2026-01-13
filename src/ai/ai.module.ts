import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OpenaiService } from './ai.service';
import { GeminiService } from './gemini/gemini.service';
import { AiController } from './ai.controller';

@Module({
  imports: [ConfigModule],
  providers: [OpenaiService, GeminiService],
  exports: [OpenaiService, GeminiService],
  controllers: [AiController],
})
export class AiModule {}

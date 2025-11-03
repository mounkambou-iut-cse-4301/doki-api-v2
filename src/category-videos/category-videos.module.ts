import { Module } from '@nestjs/common';
import { CategoryVideosController } from './category-videos.controller';
import { CategoryVideosService } from './category-videos.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [CategoryVideosController],
  providers: [CategoryVideosService, PrismaService],
  exports: [CategoryVideosService],
})
export class CategoryVideosModule {}

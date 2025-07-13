import { Module } from '@nestjs/common';
import { OrdonancesController } from './ordonances.controller';
import { OrdonancesService } from './ordonances.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
          imports: [PrismaModule],   
  
  controllers: [OrdonancesController],
  providers: [OrdonancesService]
})
export class OrdonancesModule {}

import { Module } from '@nestjs/common';
import { OrdonancesController } from './ordonances.controller';
import { OrdonancesService } from './ordonances.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { SuivisModule } from 'src/suivis/suivis.module';
import { SuivisService } from 'src/suivis/suivis.service';

@Module({
          imports: [PrismaModule, SuivisModule],   
  
  controllers: [OrdonancesController],
  providers: [OrdonancesService,SuivisService],
})
export class OrdonancesModule {}

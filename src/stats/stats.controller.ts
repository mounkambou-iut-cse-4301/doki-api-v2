import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { StatsService } from './stats.service';

@ApiTags('stats')
@Controller('stats/medecin')
export class StatsController {
  constructor(private readonly svc: StatsService) {}

  @Get(':id')
  @ApiOperation({ summary: "Stats résumées pour un médecin (abonnés + revenu total)" })
  @ApiParam({ name: 'id', type: 'integer' })
  async getMedecinStats(@Param('id', ParseIntPipe) id: number) {
    return this.svc.medecinStats(id);
  }
}

// src/admins/admins.controller.ts
import { Controller, Get, Param, ParseIntPipe, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AdminsService } from './admins.service';
import { QueryTransactionsDto } from './dto/query-transactions.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ActiveAndVerifiedGuard } from 'src/auth/guards/active-verified.guard';

 @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, ActiveAndVerifiedGuard)
@ApiTags('admins')
@Controller('admins')
export class AdminsController {
  constructor(private readonly svc: AdminsService) {}

  @Get('stats/overview')
  @ApiOperation({ summary: 'Stats globales (totaux, dernier mois, revenus)'} )
  overview() { return this.svc.overview(); }

  @Get('stats/top-doctors')
  @ApiOperation({ summary: 'Top 5 médecins par feedback' })
  topDoctors() { return this.svc.topDoctors(); }

  @Get('stats/revenues-last5')
  @ApiOperation({ summary: 'Revenus des 5 derniers mois' })
  revenueLast5Months() { return this.svc.revenueLast5Months(); }

  @Patch('users/:id/verify')
  @ApiOperation({ summary: 'Vérifier un utilisateur' })
  @ApiParam({ name: 'id', type: 'integer' })
  verifyUser(@Param('id', ParseIntPipe) id: number) { return this.svc.verifyUser(id); }

  @Patch('users/:id/toggle-block')
  @ApiOperation({ summary: 'Bloquer/Débloquer un utilisateur' })
  @ApiParam({ name: 'id', type: 'integer' })
  toggleBlockUser(@Param('id', ParseIntPipe) id: number) { return this.svc.toggleBlockUser(id); }

  @Get('transactions')
  @ApiOperation({ summary: 'Lister les transactions (filtres & pagination)' })
  listTransactions(@Query() query: QueryTransactionsDto) { return this.svc.listTransactions(query); }

  @Get('transactions/:id')
  @ApiOperation({ summary: 'Détail d\'une transaction' })
  @ApiParam({ name: 'id', type: 'integer' })
  getTransaction(@Param('id', ParseIntPipe) id: number) { return this.svc.getTransactionDetail(id); }
}
import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RetraitsService } from './retraits.service';
import { CreateParametreRetraitDto } from './dto/create-parametre-retrait.dto';
import { UpdateParametreRetraitDto } from './dto/update-parametre-retrait.dto';
import { VerifyParametreRetraitOtpDto } from './dto/verify-parametre-retrait-otp.dto';
import { DemanderRetraitDto } from './dto/demander-retrait.dto';
import { VerifyRetraitOtpDto } from './dto/verify-retrait-otp.dto';
import { QueryRetraitDto } from './dto/query-retrait.dto';
import { CompleteRetraitDto } from './dto/complete-retrait.dto';
import { CancelRetraitDto } from './dto/cancel-retrait.dto';
import {
  ApiCancelRetrait,
  ApiCompleteRetrait,
  ApiCreateParametreRetrait,
  ApiDemanderRetrait,
  ApiGetAllRetraitsAdmin,
  ApiGetMesRetraits,
  ApiGetParametreRetrait,
  ApiGetSoldeUser,
  ApiUpdateParametreRetrait,
  ApiVerifyParametreRetraitOtp,
  ApiVerifyRetraitOtp,
} from './decorators/api-retraits.decorator';

@ApiTags('Retraits')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('api/v1/retraits')
export class RetraitsController {
  constructor(private readonly retraitsService: RetraitsService) {}

  /**
   * PROCESSUS FRONTEND
   * 1. Paramétrer le numéro de retrait
   * 2. Vérifier OTP du numéro
   * 3. Voir le paramètre actuel
   * 4. Voir le solde
   * 5. Demander un retrait
   * 6. Vérifier OTP du retrait
   * 7. Voir ses retraits
   * 8. Admin voit tous les retraits
   * 9. Admin complète
   * 10. Propriétaire/Admin annule
   */

  // 1. Paramétrer le numéro de retrait
  @Post('parametres')
  @ApiCreateParametreRetrait()
  async createParametre(@Body() dto: CreateParametreRetraitDto) {
    return this.retraitsService.createParametre(dto);
  }

  // 2. Vérifier OTP du numéro de retrait
  @Post('parametres/:parametreId/verifier-otp')
  @ApiVerifyParametreRetraitOtp()
  async verifyParametreOtp(
    @Param('parametreId', ParseIntPipe) parametreId: number,
    @Body() dto: VerifyParametreRetraitOtpDto,
  ) {
    return this.retraitsService.verifyParametreOtp(parametreId, dto);
  }

  // 2 bis. Modifier puis revalider le numéro
  @Patch('parametres/:parametreId')
  @ApiUpdateParametreRetrait()
  async updateParametre(
    @Param('parametreId', ParseIntPipe) parametreId: number,
    @Body() dto: UpdateParametreRetraitDto,
  ) {
    return this.retraitsService.updateParametre(parametreId, dto);
  }

  // 2 ter. Voir le paramètre actuel
  @Get('parametres/utilisateur/:userId')
  @ApiGetParametreRetrait()
  async getParametre(@Param('userId', ParseIntPipe) userId: number) {
    return this.retraitsService.getParametreByUserId(userId);
  }

  // 3. Voir le solde avant de demander le retrait
  @Get('solde/utilisateur/:userId')
  @ApiGetSoldeUser()
  async getSolde(@Param('userId', ParseIntPipe) userId: number) {
    return this.retraitsService.getSoldeUser(userId);
  }

  // 4. Demander un retrait
  @Post('demandes')
  @ApiDemanderRetrait()
  async demanderRetrait(@Body() dto: DemanderRetraitDto) {
    return this.retraitsService.demanderRetrait(dto);
  }

  // 5. Vérifier OTP du retrait
  @Post('demandes/:retraitId/verifier-otp')
  @ApiVerifyRetraitOtp()
  async verifyRetraitOtp(
    @Param('retraitId', ParseIntPipe) retraitId: number,
    @Body() dto: VerifyRetraitOtpDto,
  ) {
    return this.retraitsService.verifyRetraitOtp(retraitId, dto);
  }

  // 6. Voir ses retraits
  @Get('demandes/utilisateur')
  @ApiGetMesRetraits()
  async getMesRetraits(@Query() query: QueryRetraitDto) {
    return this.retraitsService.getMesRetraits(query);
  }

  // 7. Côté admin : voir tous les retraits
  @Get('admin/demandes')
  @ApiGetAllRetraitsAdmin()
  async getAllRetraitsAdmin(@Query() query: QueryRetraitDto) {
    return this.retraitsService.getAllRetraitsAdmin(query);
  }

  // 8. Côté admin : compléter un retrait
  @Patch('admin/demandes/:retraitId/completer')
  @ApiCompleteRetrait()
  async completeRetrait(
    @Param('retraitId', ParseIntPipe) retraitId: number,
    @Body() dto: CompleteRetraitDto,
  ) {
    return this.retraitsService.completeRetrait(retraitId, dto);
  }

  // 9. Propriétaire ou admin : annuler un retrait
  @Patch('demandes/:retraitId/annuler')
  @ApiCancelRetrait()
  async cancelRetrait(
    @Param('retraitId', ParseIntPipe) retraitId: number,
    @Body() dto: CancelRetraitDto,
  ) {
    return this.retraitsService.cancelRetrait(retraitId, dto);
  }
}
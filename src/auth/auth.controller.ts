import { Body, Controller, Post, UseGuards, Req, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { RequestResetDto } from './dto/request-reset.dto';
import { ConfirmResetDto } from './dto/confirm-reset.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ActiveAndVerifiedGuard } from './guards/active-verified.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Connexion par téléphone + mot de passe' })
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @Patch('change-password')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, ActiveAndVerifiedGuard)
  @ApiOperation({ summary: 'Modifier son mot de passe (auth requis)' })
  changePassword(@Req() req: any, @Body() dto: ChangePasswordDto) {
    return this.auth.changePassword(req.user.sub, dto);
  }

  @Post('request-reset')
  @ApiOperation({ summary: 'Demander un OTP par email' })
  requestReset(@Body() dto: RequestResetDto) {
    return this.auth.requestReset(dto);
  }

  @Post('confirm-reset')
  @ApiOperation({ summary: 'Confirmer OTP et réinitialiser le mot de passe' })
  confirmReset(@Body() dto: ConfirmResetDto) {
    return this.auth.confirmReset(dto);
  }
}
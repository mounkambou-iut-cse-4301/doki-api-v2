import { Controller, Get, Post, Body, Patch, UseGuards, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { CreateSettingDto } from './dto/create-setting.dto';
import { UpdateSettingDto } from './dto/update-setting.dto';

import {
  ApiCreateOrUpdateSetting,
  ApiGetSettings,
  ApiUpdateSettings
} from './decorators/api-setting.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ActiveAndVerifiedGuard } from 'src/auth/guards/active-verified.guard';

@ApiTags('Settings')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, ActiveAndVerifiedGuard)
@Controller('api/v1/settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Post()
  @ApiCreateOrUpdateSetting()
  async createOrUpdate(@Body() dto: CreateSettingDto, @Request() req) {
    const userId = req.user?.userId || req.user?.id;
    return this.settingsService.createOrUpdate(dto, userId);
  }

  @Get()
  @ApiGetSettings()
  async getSettings() {
    return this.settingsService.getSettings();
  }

  @Patch()
  @ApiUpdateSettings()
  async updateSettings(@Body() dto: UpdateSettingDto, @Request() req) {
    const userId = req.user?.userId || req.user?.id;
    return this.settingsService.updateSettings(dto, userId);
  }
}
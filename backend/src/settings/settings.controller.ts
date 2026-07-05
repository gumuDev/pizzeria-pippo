import { Body, Controller, Get, Post, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../auth/types/jwt.types';
import { SettingsService } from './settings.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { TestTelegramDto } from './dto/test-telegram.dto';

@UseGuards(JwtAuthGuard)
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Get()
  getSettings(@CurrentUser() user: CurrentUserPayload) {
    return this.settingsService.getSettings(user);
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Put()
  updateSettings(@CurrentUser() user: CurrentUserPayload, @Body() dto: UpdateSettingsDto) {
    return this.settingsService.updateSettings(user, dto);
  }

  // Sin RolesGuard: cualquier autenticado (POS/cajero) puede leer el ancho de papel.
  @Get('printer')
  getPrinterSettings(@CurrentUser() user: CurrentUserPayload) {
    return this.settingsService
      .getPrinterPaperWidth(user)
      .then((printer_paper_width) => ({ printer_paper_width }));
  }

  // Sin RolesGuard: fix del bug de RLS — cocinero necesita leer esto (ver plan Fase 3).
  @Get('kitchen-threshold')
  getKitchenThreshold(@CurrentUser() user: CurrentUserPayload) {
    return this.settingsService
      .getKitchenLateThresholdMinutes(user)
      .then((kitchen_late_threshold_minutes) => ({ kitchen_late_threshold_minutes }));
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Post('test')
  testTelegram(@Body() dto: TestTelegramDto) {
    return this.settingsService.testTelegramConnection(dto);
  }
}

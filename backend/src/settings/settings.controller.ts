import { Body, Controller, Get, Post, Put, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../auth/types/jwt.types';
import { SettingsService } from './settings.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { TestTelegramDto } from './dto/test-telegram.dto';
import { GetRawSettingsQueryDto } from './dto/get-raw-settings-query.dto';
import { SaveRawSettingsDto } from './dto/save-raw-settings.dto';

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

  // Config del bot de IA de Telegram (proveedor, modelo, límites por plan) —
  // no encaja en el shape fijo de GET/PUT /settings, usa el store genérico.
  @UseGuards(RolesGuard)
  @Roles('admin')
  @Get('raw')
  getRawSettings(@CurrentUser() user: CurrentUserPayload, @Query() query: GetRawSettingsQueryDto) {
    return this.settingsService.getRawSettings(user, query.keys.split(','));
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Put('raw')
  saveRawSettings(@CurrentUser() user: CurrentUserPayload, @Body() dto: SaveRawSettingsDto) {
    return this.settingsService.saveRawSettings(user, dto.updates);
  }
}

import { UnauthorizedException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { TelegramWebhookGuard } from './telegram-webhook.guard';
import { SettingsService } from '../settings/settings.service';

function makeContext(headers: Record<string, string>): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => ({ headers }) }),
  } as unknown as ExecutionContext;
}

describe('TelegramWebhookGuard', () => {
  let settingsService: { getRawSettingsForFirstBusiness: jest.Mock };
  let guard: TelegramWebhookGuard;

  beforeEach(() => {
    settingsService = { getRawSettingsForFirstBusiness: jest.fn() };
    guard = new TelegramWebhookGuard(settingsService as unknown as SettingsService);
  });

  it('permite el paso si no hay secreto configurado (paridad con el comportamiento viejo)', async () => {
    settingsService.getRawSettingsForFirstBusiness.mockResolvedValue({ telegram_webhook_secret: '' });

    await expect(guard.canActivate(makeContext({}))).resolves.toBe(true);
  });

  it('permite el paso si el secreto recibido coincide', async () => {
    settingsService.getRawSettingsForFirstBusiness.mockResolvedValue({ telegram_webhook_secret: 'shh' });

    await expect(
      guard.canActivate(makeContext({ 'x-telegram-bot-api-secret-token': 'shh' })),
    ).resolves.toBe(true);
  });

  it('rechaza si el secreto configurado no coincide con el recibido', async () => {
    settingsService.getRawSettingsForFirstBusiness.mockResolvedValue({ telegram_webhook_secret: 'shh' });

    await expect(
      guard.canActivate(makeContext({ 'x-telegram-bot-api-secret-token': 'wrong' })),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('rechaza si hay secreto configurado pero no se envía ninguno', async () => {
    settingsService.getRawSettingsForFirstBusiness.mockResolvedValue({ telegram_webhook_secret: 'shh' });

    await expect(guard.canActivate(makeContext({}))).rejects.toThrow(UnauthorizedException);
  });
});

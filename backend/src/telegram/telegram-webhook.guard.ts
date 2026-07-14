import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { SettingsService } from '../settings/settings.service';

// Ported 1:1 from the old Next.js webhook: if telegram_webhook_secret isn't
// configured (empty), the check is skipped and the request is allowed
// through. Not our call to tighten this during a migration — same behavior
// as before, just flagging it here since it's a soft spot.
@Injectable()
export class TelegramWebhookGuard implements CanActivate {
  constructor(private readonly settingsService: SettingsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const settings = await this.settingsService.getRawSettingsForFirstBusiness(['telegram_webhook_secret']);
    const expectedSecret = settings['telegram_webhook_secret'] ?? '';
    const receivedSecret = request.headers['x-telegram-bot-api-secret-token'] ?? '';

    if (expectedSecret && receivedSecret !== expectedSecret) {
      throw new UnauthorizedException();
    }
    return true;
  }
}

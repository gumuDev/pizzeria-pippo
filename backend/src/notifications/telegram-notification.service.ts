import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { NotificationPort } from './notification.port';

@Injectable()
export class TelegramNotificationService implements NotificationPort {
  constructor(private readonly prisma: PrismaService) {}

  // Never throws — a notification failure must never block the calling flow
  // (matches the old sendTelegramAlert behavior, which swallowed all errors).
  async send(businessId: string, message: string): Promise<void> {
    try {
      const rows = await this.prisma.appSetting.findMany({
        where: { businessId, key: { in: ['telegram_bot_token', 'telegram_chat_id', 'telegram_enabled'] } },
      });
      const config = new Map(rows.map((r) => [r.key, r.value]));

      if (config.get('telegram_enabled') !== 'true') return;
      const token = config.get('telegram_bot_token');
      const chatId = config.get('telegram_chat_id');
      if (!token || !chatId) return;

      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: 'Markdown' }),
      });
    } catch (err) {
      console.error('[TelegramNotificationService] send error:', err);
    }
  }
}

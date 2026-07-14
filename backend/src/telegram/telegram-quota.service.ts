import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';
import { todayInBolivia } from '../common/utils/timezone';

export interface QuotaCheckResult {
  allowed: boolean;
  limit: number;
  used: number;
}

@Injectable()
export class TelegramQuotaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settingsService: SettingsService,
  ) {}

  async checkAndIncrement(chatId: string, plan: string): Promise<QuotaCheckResult> {
    const settings = await this.settingsService.getRawSettingsForFirstBusiness([
      `telegram_plan_${plan}_limit`,
      'telegram_plan_basic_limit',
    ]);
    const limit = parseInt(settings[`telegram_plan_${plan}_limit`] ?? settings['telegram_plan_basic_limit'] ?? '10', 10);

    const today = new Date(todayInBolivia());
    const usage = await this.prisma.telegramUsage.findUnique({
      where: { chatId_date: { chatId, date: today } },
    });
    const used = usage?.messageCount ?? 0;

    if (used >= limit) return { allowed: false, limit, used };

    await this.prisma.telegramUsage.upsert({
      where: { chatId_date: { chatId, date: today } },
      create: { chatId, date: today, messageCount: used + 1 },
      update: { messageCount: used + 1, updatedAt: new Date() },
    });

    return { allowed: true, limit, used: used + 1 };
  }
}

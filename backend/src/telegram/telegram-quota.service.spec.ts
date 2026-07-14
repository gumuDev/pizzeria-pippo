import { TelegramQuotaService } from './telegram-quota.service';
import { PrismaService } from '../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';
import { todayInBolivia } from '../common/utils/timezone';

describe('TelegramQuotaService', () => {
  let prisma: { telegramUsage: { findUnique: jest.Mock; upsert: jest.Mock } };
  let settingsService: { getRawSettingsForFirstBusiness: jest.Mock };
  let service: TelegramQuotaService;

  beforeEach(() => {
    prisma = { telegramUsage: { findUnique: jest.fn(), upsert: jest.fn() } };
    settingsService = { getRawSettingsForFirstBusiness: jest.fn() };
    service = new TelegramQuotaService(prisma as unknown as PrismaService, settingsService as unknown as SettingsService);
  });

  it('usa el límite del plan basic si el plan pedido no tiene límite propio configurado', async () => {
    settingsService.getRawSettingsForFirstBusiness.mockResolvedValue({ telegram_plan_basic_limit: '10' });
    prisma.telegramUsage.findUnique.mockResolvedValue(null);

    const result = await service.checkAndIncrement('chat-1', 'pro');

    expect(result).toEqual({ allowed: true, limit: 10, used: 1 });
  });

  it('usa el límite propio del plan si está configurado', async () => {
    settingsService.getRawSettingsForFirstBusiness.mockResolvedValue({
      telegram_plan_pro_limit: '50',
      telegram_plan_basic_limit: '10',
    });
    prisma.telegramUsage.findUnique.mockResolvedValue({ messageCount: 49 });

    const result = await service.checkAndIncrement('chat-1', 'pro');

    expect(result).toEqual({ allowed: true, limit: 50, used: 50 });
    expect(prisma.telegramUsage.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ update: { messageCount: 50, updatedAt: expect.any(Date) } }),
    );
  });

  it('bloquea cuando ya se alcanzó el límite, sin incrementar', async () => {
    settingsService.getRawSettingsForFirstBusiness.mockResolvedValue({ telegram_plan_basic_limit: '10' });
    prisma.telegramUsage.findUnique.mockResolvedValue({ messageCount: 10 });

    const result = await service.checkAndIncrement('chat-1', 'basic');

    expect(result).toEqual({ allowed: false, limit: 10, used: 10 });
    expect(prisma.telegramUsage.upsert).not.toHaveBeenCalled();
  });

  it('busca el uso de hoy con la fecha correcta', async () => {
    settingsService.getRawSettingsForFirstBusiness.mockResolvedValue({ telegram_plan_basic_limit: '10' });
    prisma.telegramUsage.findUnique.mockResolvedValue(null);

    await service.checkAndIncrement('chat-1', 'basic');

    expect(prisma.telegramUsage.findUnique).toHaveBeenCalledWith({
      where: { chatId_date: { chatId: 'chat-1', date: new Date(todayInBolivia()) } },
    });
  });
});

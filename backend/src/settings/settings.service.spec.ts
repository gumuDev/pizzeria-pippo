import { Test, TestingModule } from '@nestjs/testing';
import { InternalServerErrorException } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { PrismaService } from '../prisma/prisma.service';
import type { CurrentUserPayload } from '../auth/types/jwt.types';

describe('SettingsService', () => {
  let service: SettingsService;
  let prisma: {
    appSetting: { findMany: jest.Mock; findUnique: jest.Mock; upsert: jest.Mock };
  };

  const admin: CurrentUserPayload = {
    id: 'u1',
    role: 'admin',
    branch_id: null,
    full_name: 'Admin',
    business_id: 'biz1',
  };
  const adminSinNegocio: CurrentUserPayload = {
    id: 'u2',
    role: 'admin',
    branch_id: null,
    full_name: 'Sin negocio',
    business_id: null,
  };

  beforeEach(async () => {
    prisma = {
      appSetting: { findMany: jest.fn(), findUnique: jest.fn(), upsert: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [SettingsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(SettingsService);
  });

  describe('getSettings', () => {
    it('aplica defaults cuando no hay filas y enmascara el token', async () => {
      prisma.appSetting.findMany.mockResolvedValue([
        { key: 'telegram_bot_token', value: '123456789abcdef' },
      ]);

      const result = await service.getSettings(admin);

      expect(prisma.appSetting.findMany).toHaveBeenCalledWith({
        where: { businessId: 'biz1', key: { in: expect.arrayContaining(['telegram_bot_token']) } },
      });
      expect(result).toEqual({
        telegram_bot_token: '123456***def',
        telegram_chat_id: '',
        telegram_enabled: false,
        kitchen_late_threshold_minutes: 10,
        printer_paper_width: 58,
      });
    });

    it('lanza si el usuario no tiene business_id', async () => {
      await expect(service.getSettings(adminSinNegocio)).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('updateSettings', () => {
    it('no sobreescribe el token si viene enmascarado', async () => {
      await service.updateSettings(admin, {
        telegram_bot_token: '123456***def',
        telegram_chat_id: 'chat1',
        telegram_enabled: true,
        kitchen_late_threshold_minutes: 15,
        printer_paper_width: 80,
      });

      const keysUpserted = prisma.appSetting.upsert.mock.calls.map((call) => call[0].where.businessId_key.key);
      expect(keysUpserted).not.toContain('telegram_bot_token');
      expect(keysUpserted).toEqual(
        expect.arrayContaining(['telegram_chat_id', 'telegram_enabled', 'kitchen_late_threshold_minutes', 'printer_paper_width']),
      );
    });

    it('sí actualiza el token si viene un valor nuevo sin enmascarar', async () => {
      await service.updateSettings(admin, {
        telegram_bot_token: 'nuevo-token-real',
        telegram_chat_id: 'chat1',
        telegram_enabled: true,
        kitchen_late_threshold_minutes: 15,
        printer_paper_width: 58,
      });

      const tokenCall = prisma.appSetting.upsert.mock.calls.find(
        (call) => call[0].where.businessId_key.key === 'telegram_bot_token',
      );
      expect(tokenCall[0].create.value).toBe('nuevo-token-real');
    });

    it('normaliza printer_paper_width a 58 si no es 80', async () => {
      await service.updateSettings(admin, {
        telegram_chat_id: '',
        telegram_enabled: false,
        kitchen_late_threshold_minutes: 10,
        printer_paper_width: 999 as unknown as number,
      });

      const paperCall = prisma.appSetting.upsert.mock.calls.find(
        (call) => call[0].where.businessId_key.key === 'printer_paper_width',
      );
      expect(paperCall[0].create.value).toBe('58');
    });
  });

  describe('getKitchenLateThresholdMinutes', () => {
    it('cualquier usuario autenticado con business_id puede leerlo (fix del bug de RLS)', async () => {
      const cocinero: CurrentUserPayload = {
        id: 'u3',
        role: 'cocinero',
        branch_id: 'b1',
        full_name: 'Cocinero',
        business_id: 'biz1',
      };
      prisma.appSetting.findUnique.mockResolvedValue({ value: '20' });

      const result = await service.getKitchenLateThresholdMinutes(cocinero);

      expect(result).toBe(20);
    });

    it('devuelve el default 10 si no hay fila', async () => {
      prisma.appSetting.findUnique.mockResolvedValue(null);

      const result = await service.getKitchenLateThresholdMinutes(admin);

      expect(result).toBe(10);
    });
  });
});

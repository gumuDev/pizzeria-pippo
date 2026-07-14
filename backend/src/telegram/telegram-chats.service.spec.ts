import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TelegramChatsService } from './telegram-chats.service';
import { PrismaService } from '../prisma/prisma.service';
import { todayInBolivia } from '../common/utils/timezone';

describe('TelegramChatsService', () => {
  let service: TelegramChatsService;
  let prisma: {
    telegramAuthorizedChat: { findMany: jest.Mock; findUnique: jest.Mock; create: jest.Mock; update: jest.Mock; delete: jest.Mock };
    telegramUsage: { findMany: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      telegramAuthorizedChat: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      telegramUsage: { findMany: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [TelegramChatsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(TelegramChatsService);
  });

  describe('list', () => {
    it('mapea las filas al shape de @pippo/shared con messages_today desde telegram_usage', async () => {
      prisma.telegramAuthorizedChat.findMany.mockResolvedValue([
        {
          id: '1',
          chatId: 'chat-1',
          type: 'personal',
          label: 'Dueño',
          plan: 'pro',
          isActive: true,
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
        },
      ]);
      prisma.telegramUsage.findMany.mockResolvedValue([{ chatId: 'chat-1', messageCount: 4 }]);

      const result = await service.list();

      expect(result).toEqual([
        {
          id: '1',
          chat_id: 'chat-1',
          type: 'personal',
          label: 'Dueño',
          plan: 'pro',
          is_active: true,
          created_at: '2026-01-01T00:00:00.000Z',
          messages_today: 4,
        },
      ]);
      expect(prisma.telegramUsage.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { chatId: { in: ['chat-1'] }, date: new Date(todayInBolivia()) } }),
      );
    });

    it('usa 0 mensajes cuando no hay fila de uso para hoy', async () => {
      prisma.telegramAuthorizedChat.findMany.mockResolvedValue([
        { id: '1', chatId: 'chat-1', type: 'group', label: '', plan: 'basic', isActive: true, createdAt: new Date() },
      ]);
      prisma.telegramUsage.findMany.mockResolvedValue([]);

      const result = await service.list();

      expect(result[0].messages_today).toBe(0);
    });
  });

  describe('create', () => {
    it('usa label vacío y plan basic por defecto si no se envían', async () => {
      prisma.telegramAuthorizedChat.create.mockResolvedValue({ id: '1' });

      await service.create({ chat_id: 'chat-1', type: 'personal' });

      expect(prisma.telegramAuthorizedChat.create).toHaveBeenCalledWith({
        data: { chatId: 'chat-1', type: 'personal', label: '', plan: 'basic' },
      });
    });
  });

  describe('update', () => {
    it('lanza NotFoundException si el chat no existe', async () => {
      prisma.telegramAuthorizedChat.findUnique.mockResolvedValue(null);

      await expect(service.update('1', { label: 'nuevo' })).rejects.toThrow(NotFoundException);
      expect(prisma.telegramAuthorizedChat.update).not.toHaveBeenCalled();
    });

    it('actualiza solo los campos enviados', async () => {
      prisma.telegramAuthorizedChat.findUnique.mockResolvedValue({ id: '1' });

      await service.update('1', { is_active: false });

      expect(prisma.telegramAuthorizedChat.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { isActive: false },
      });
    });
  });

  describe('remove', () => {
    it('lanza NotFoundException si el chat no existe', async () => {
      prisma.telegramAuthorizedChat.findUnique.mockResolvedValue(null);

      await expect(service.remove('1')).rejects.toThrow(NotFoundException);
      expect(prisma.telegramAuthorizedChat.delete).not.toHaveBeenCalled();
    });

    it('borra el chat si existe', async () => {
      prisma.telegramAuthorizedChat.findUnique.mockResolvedValue({ id: '1' });

      await service.remove('1');

      expect(prisma.telegramAuthorizedChat.delete).toHaveBeenCalledWith({ where: { id: '1' } });
    });
  });

  describe('findByChatId', () => {
    it('busca por chat_id (no por id)', async () => {
      prisma.telegramAuthorizedChat.findUnique.mockResolvedValue({ id: '1', chatId: 'chat-1', isActive: true, plan: 'basic', type: 'personal' });

      const result = await service.findByChatId('chat-1');

      expect(prisma.telegramAuthorizedChat.findUnique).toHaveBeenCalledWith({ where: { chatId: 'chat-1' } });
      expect(result?.chatId).toBe('chat-1');
    });

    it('devuelve null si no existe', async () => {
      prisma.telegramAuthorizedChat.findUnique.mockResolvedValue(null);

      const result = await service.findByChatId('no-existe');

      expect(result).toBeNull();
    });
  });
});

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { todayInBolivia } from '../common/utils/timezone';
import type { TelegramAuthorizedChat } from '@pippo/shared';
import type { CreateAuthorizedChatDto } from './dto/create-authorized-chat.dto';
import type { UpdateAuthorizedChatDto } from './dto/update-authorized-chat.dto';
import type { TelegramAuthorizedChat as TelegramAuthorizedChatRow } from '@prisma/client';

@Injectable()
export class TelegramChatsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(): Promise<TelegramAuthorizedChat[]> {
    const chats = await this.prisma.telegramAuthorizedChat.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const today = new Date(todayInBolivia());
    const usageRows = await this.prisma.telegramUsage.findMany({
      where: { chatId: { in: chats.map((c) => c.chatId) }, date: today },
    });
    const usageByChat = new Map(usageRows.map((u) => [u.chatId, u.messageCount]));

    return chats.map((c) => ({
      id: c.id,
      chat_id: c.chatId,
      type: c.type as TelegramAuthorizedChat['type'],
      label: c.label,
      plan: c.plan as TelegramAuthorizedChat['plan'],
      is_active: c.isActive,
      created_at: c.createdAt.toISOString(),
      messages_today: usageByChat.get(c.chatId) ?? 0,
    }));
  }

  async create(dto: CreateAuthorizedChatDto): Promise<{ id: string }> {
    const row = await this.prisma.telegramAuthorizedChat.create({
      data: {
        chatId: dto.chat_id,
        type: dto.type,
        label: dto.label ?? '',
        plan: dto.plan ?? 'basic',
      },
    });
    return { id: row.id };
  }

  async update(id: string, dto: UpdateAuthorizedChatDto): Promise<void> {
    await this.assertExists(id);
    await this.prisma.telegramAuthorizedChat.update({
      where: { id },
      data: {
        ...(dto.label !== undefined && { label: dto.label }),
        ...(dto.plan !== undefined && { plan: dto.plan }),
        ...(dto.is_active !== undefined && { isActive: dto.is_active }),
      },
    });
  }

  async remove(id: string): Promise<void> {
    await this.assertExists(id);
    await this.prisma.telegramAuthorizedChat.delete({ where: { id } });
  }

  // Used by the webhook to check authorization — returns the raw row (not
  // the @pippo/shared shape) since this is internal, server-side only.
  async findByChatId(chatId: string): Promise<TelegramAuthorizedChatRow | null> {
    return this.prisma.telegramAuthorizedChat.findUnique({ where: { chatId } });
  }

  private async assertExists(id: string): Promise<void> {
    const chat = await this.prisma.telegramAuthorizedChat.findUnique({ where: { id } });
    if (!chat) throw new NotFoundException('Chat autorizado no encontrado');
  }
}

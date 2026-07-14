import { Injectable } from '@nestjs/common';

@Injectable()
export class TelegramSenderService {
  async sendMessage(botToken: string, chatId: string, text: string): Promise<void> {
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' }),
    });
  }

  async sendDocument(botToken: string, chatId: string, buffer: Buffer, filename: string): Promise<void> {
    const form = new FormData();
    form.append('chat_id', chatId);
    form.append(
      'document',
      new Blob([new Uint8Array(buffer)], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
      filename,
    );
    await fetch(`https://api.telegram.org/bot${botToken}/sendDocument`, {
      method: 'POST',
      body: form,
    });
  }
}

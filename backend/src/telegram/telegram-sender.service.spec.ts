import { TelegramSenderService } from './telegram-sender.service';

describe('TelegramSenderService', () => {
  let service: TelegramSenderService;
  let fetchMock: jest.Mock;

  beforeEach(() => {
    service = new TelegramSenderService();
    fetchMock = jest.fn().mockResolvedValue({ ok: true });
    global.fetch = fetchMock;
  });

  it('sendMessage llama a la API de Telegram con el texto y parse_mode Markdown', async () => {
    await service.sendMessage('bot-token', 'chat-1', 'hola');

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.telegram.org/botbot-token/sendMessage',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ chat_id: 'chat-1', text: 'hola', parse_mode: 'Markdown' }),
      }),
    );
  });

  it('sendDocument arma un FormData con el chat_id y el archivo', async () => {
    await service.sendDocument('bot-token', 'chat-1', Buffer.from('contenido'), 'reporte.xlsx');

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.telegram.org/botbot-token/sendDocument',
      expect.objectContaining({ method: 'POST' }),
    );
    const call = fetchMock.mock.calls[0];
    expect(call[1].body).toBeInstanceOf(FormData);
  });
});

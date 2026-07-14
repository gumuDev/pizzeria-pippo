// Loosely typed on purpose — Telegram sends many update shapes (edited
// messages, callback queries, etc.) we deliberately ignore. Kept as a plain
// interface (not a class) so Nest's global ValidationPipe doesn't attempt to
// validate/reject shapes we don't care about; the handler no-ops on anything
// without message.text, same as the payload we do care about.
export interface TelegramUpdatePayload {
  message?: {
    text?: string;
    chat: { id: number; type: string };
  };
}

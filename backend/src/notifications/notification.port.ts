export const NOTIFICATION_PORT = Symbol('NOTIFICATION_PORT');

// Abstracts "send a message to whoever is configured to receive alerts for
// this business" behind a swappable channel. Telegram is the only
// implementation today (TelegramNotificationService) — adding a new channel
// (WhatsApp, email, SMS) means writing a new class that implements this
// interface, without touching the callers (e.g. LowStockAlertService).
export interface NotificationPort {
  send(businessId: string, message: string): Promise<void>;
}

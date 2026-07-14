import { Module } from '@nestjs/common';
import { NOTIFICATION_PORT } from './notification.port';
import { TelegramNotificationService } from './telegram-notification.service';
import { LowStockAlertService } from './low-stock-alert.service';

@Module({
  providers: [
    { provide: NOTIFICATION_PORT, useClass: TelegramNotificationService },
    LowStockAlertService,
  ],
  exports: [LowStockAlertService],
})
export class NotificationsModule {}

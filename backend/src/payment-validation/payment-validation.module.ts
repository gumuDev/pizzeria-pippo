import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { OrdersModule } from '../orders/orders.module';
import { DevicesModule } from '../devices/devices.module';
import { ApiKeyGuard } from '../common/guards/api-key.guard';
import { PaymentValidationController } from './payment-validation.controller';
import { PaymentValidationService } from './payment-validation.service';

@Module({
  imports: [AuthModule, OrdersModule, DevicesModule],
  controllers: [PaymentValidationController],
  providers: [PaymentValidationService, ApiKeyGuard],
})
export class PaymentValidationModule {}

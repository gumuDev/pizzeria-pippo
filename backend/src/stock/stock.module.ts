import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { StockController } from './stock.controller';
import { StockService } from './stock.service';
import { ProductStockService } from './product-stock.service';

@Module({
  imports: [AuthModule],
  controllers: [StockController],
  providers: [StockService, ProductStockService],
})
export class StockModule {}

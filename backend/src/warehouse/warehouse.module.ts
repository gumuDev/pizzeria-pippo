import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { WarehouseController } from './warehouse.controller';
import { WarehouseService } from './warehouse.service';
import { WarehouseProductService } from './warehouse-product.service';

@Module({
  imports: [AuthModule],
  controllers: [WarehouseController],
  providers: [WarehouseService, WarehouseProductService],
})
export class WarehouseModule {}

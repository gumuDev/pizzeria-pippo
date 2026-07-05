import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ReportsModule } from './reports/reports.module';
import { IngredientsModule } from './ingredients/ingredients.module';
import { ProductsModule } from './products/products.module';
import { StockModule } from './stock/stock.module';
import { WarehouseModule } from './warehouse/warehouse.module';
import { PromotionsModule } from './promotions/promotions.module';
import { BranchesModule } from './branches/branches.module';
import { VariantTypesModule } from './variant-types/variant-types.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    ReportsModule,
    IngredientsModule,
    ProductsModule,
    StockModule,
    WarehouseModule,
    PromotionsModule,
    BranchesModule,
    VariantTypesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

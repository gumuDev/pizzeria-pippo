import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { OwnBranchOrAdminGuard } from '../common/guards/own-branch-or-admin.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../auth/types/jwt.types';
import { StockService } from './stock.service';
import { ProductStockService } from './product-stock.service';
import { ListStockQueryDto } from './dto/list-stock-query.dto';
import { ListAlertsQueryDto } from './dto/list-alerts-query.dto';
import { ListMovementsQueryDto } from './dto/list-movements-query.dto';
import { PurchaseStockDto } from './dto/purchase-stock.dto';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { UpdateMinQuantityDto } from './dto/update-min-quantity.dto';
import { ListProductStockQueryDto } from './dto/list-product-stock-query.dto';
import { ListProductMovementsQueryDto } from './dto/list-product-movements-query.dto';
import { PurchaseProductStockDto } from './dto/purchase-product-stock.dto';
import { AdjustProductStockDto } from './dto/adjust-product-stock.dto';

@UseGuards(JwtAuthGuard)
@Controller('stock')
export class StockController {
  constructor(
    private readonly stockService: StockService,
    private readonly productStockService: ProductStockService,
  ) {}

  @UseGuards(OwnBranchOrAdminGuard)
  @Get()
  list(@Query() query: ListStockQueryDto) {
    return this.stockService.list(query);
  }

  @UseGuards(OwnBranchOrAdminGuard)
  @Get('alerts')
  getAlerts(@Query() query: ListAlertsQueryDto) {
    return this.stockService.getAlerts(query);
  }

  @UseGuards(OwnBranchOrAdminGuard)
  @Get('movements')
  getMovements(@Query() query: ListMovementsQueryDto) {
    return this.stockService.getMovements(query);
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Post('purchase')
  purchase(@Body() dto: PurchaseStockDto, @CurrentUser() user: CurrentUserPayload) {
    return this.stockService.purchase(dto, user.id);
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Post('adjust')
  adjust(@Body() dto: AdjustStockDto, @CurrentUser() user: CurrentUserPayload) {
    return this.stockService.adjust(dto, user.id);
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Patch(':id')
  updateMinQuantity(@Param('id') id: string, @Body() dto: UpdateMinQuantityDto) {
    return this.stockService.updateMinQuantity(id, dto.min_quantity);
  }

  // Resale stock (branch_product_stock / product_stock_movements) — real RLS is
  // "any authenticated user" with no role/branch restriction, see 2026-07-02-nestjs-fase2-rls-guards.
  // That's why these endpoints only carry JwtAuthGuard, no RolesGuard or OwnBranchOrAdminGuard.
  @Get('products')
  listProductStock(@Query() query: ListProductStockQueryDto) {
    return this.productStockService.list(query);
  }

  @Get('product-movements')
  getProductMovements(@Query() query: ListProductMovementsQueryDto) {
    return this.productStockService.getMovements(query);
  }

  @Get('resale-variants')
  getResaleVariants() {
    return this.productStockService.getResaleVariants();
  }

  @Post('product-purchase')
  productPurchase(@Body() dto: PurchaseProductStockDto, @CurrentUser() user: CurrentUserPayload) {
    return this.productStockService.purchase(dto, user.id);
  }

  @Post('product-adjust')
  productAdjust(@Body() dto: AdjustProductStockDto, @CurrentUser() user: CurrentUserPayload) {
    return this.productStockService.adjust(dto, user.id);
  }

  @Patch('products/:id')
  updateProductMinQuantity(@Param('id') id: string, @Body() dto: UpdateMinQuantityDto) {
    return this.productStockService.updateMinQuantity(id, dto.min_quantity);
  }
}

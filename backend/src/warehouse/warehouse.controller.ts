import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../auth/types/jwt.types';
import { WarehouseService } from './warehouse.service';
import { WarehouseProductService } from './warehouse-product.service';
import { ListWarehouseStockQueryDto } from './dto/list-warehouse-stock-query.dto';
import { ListWarehouseMovementsQueryDto } from './dto/list-warehouse-movements-query.dto';
import { PurchaseWarehouseStockDto } from './dto/purchase-warehouse-stock.dto';
import { AdjustWarehouseStockDto } from './dto/adjust-warehouse-stock.dto';
import { TransferWarehouseStockDto } from './dto/transfer-warehouse-stock.dto';
import { UpdateWarehouseMinQuantityDto } from './dto/update-warehouse-min-quantity.dto';
import { ListWarehouseProductMovementsQueryDto } from './dto/list-warehouse-product-movements-query.dto';
import { PurchaseWarehouseProductStockDto } from './dto/purchase-warehouse-product-stock.dto';
import { AdjustWarehouseProductStockDto } from './dto/adjust-warehouse-product-stock.dto';
import { TransferWarehouseProductStockDto } from './dto/transfer-warehouse-product-stock.dto';

// Central ingredient warehouse (warehouse_stock/warehouse_movements): real RLS is
// admin-only for EVERYTHING (select included) — see docker exec pippo_db psql.
// Resale warehouse (warehouse_product_stock/warehouse_product_movements): real RLS
// is "any authenticated user" with no restriction, same as branch_product_stock.
@UseGuards(JwtAuthGuard)
@Controller('warehouse')
export class WarehouseController {
  constructor(
    private readonly warehouseService: WarehouseService,
    private readonly warehouseProductService: WarehouseProductService,
  ) {}

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Get('stock')
  listStock(@Query() query: ListWarehouseStockQueryDto) {
    return this.warehouseService.list(query);
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Get('movements')
  getMovements(@Query() query: ListWarehouseMovementsQueryDto) {
    return this.warehouseService.getMovements(query);
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Patch('stock/:id')
  updateMinQuantity(@Param('id') id: string, @Body() dto: UpdateWarehouseMinQuantityDto) {
    return this.warehouseService.updateMinQuantity(id, dto);
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Delete('stock/:id')
  removeStock(@Param('id') id: string) {
    return this.warehouseService.remove(id);
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Post('purchase')
  purchase(@Body() dto: PurchaseWarehouseStockDto, @CurrentUser() user: CurrentUserPayload) {
    return this.warehouseService.purchase(dto, user.id);
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Post('adjust')
  adjust(@Body() dto: AdjustWarehouseStockDto, @CurrentUser() user: CurrentUserPayload) {
    return this.warehouseService.adjust(dto, user.id);
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Post('transfer')
  transfer(@Body() dto: TransferWarehouseStockDto, @CurrentUser() user: CurrentUserPayload) {
    return this.warehouseService.transfer(dto, user.id);
  }

  @Get('product-stock')
  listProductStock() {
    return this.warehouseProductService.list();
  }

  @Get('product-movements')
  getProductMovements(@Query() query: ListWarehouseProductMovementsQueryDto) {
    return this.warehouseProductService.getMovements(query);
  }

  @Post('product-purchase')
  productPurchase(@Body() dto: PurchaseWarehouseProductStockDto, @CurrentUser() user: CurrentUserPayload) {
    return this.warehouseProductService.purchase(dto, user.id);
  }

  @Post('product-adjust')
  productAdjust(@Body() dto: AdjustWarehouseProductStockDto, @CurrentUser() user: CurrentUserPayload) {
    return this.warehouseProductService.adjust(dto, user.id);
  }

  @Post('product-transfer')
  productTransfer(@Body() dto: TransferWarehouseProductStockDto, @CurrentUser() user: CurrentUserPayload) {
    return this.warehouseProductService.transfer(dto, user.id);
  }
}

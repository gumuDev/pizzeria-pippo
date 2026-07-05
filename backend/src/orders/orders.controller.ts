import { Body, Controller, Get, Post, Query, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../auth/types/jwt.types';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { GetDayOrdersQueryDto } from './dto/get-day-orders-query.dto';

@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  async create(
    @Body() dto: CreateOrderDto,
    @CurrentUser() user: CurrentUserPayload,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.ordersService.create(dto, user);
    // 200 for an idempotency-key hit (order already existed), 201 for a new order
    res.status(result.duplicate ? 200 : 201);
    return { order_id: result.order_id, daily_number: result.daily_number };
  }

  @Get()
  getDayOrders(@Query() query: GetDayOrdersQueryDto) {
    return this.ordersService.getDayOrders(query.branchId, query.date);
  }
}

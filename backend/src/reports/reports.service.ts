import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { dateRangeFrom, dateRangeTo, toBoliviaDate } from '../common/utils/timezone';
import type { ReportQueryDto } from './dto/report-query.dto';
import type { CashierReportQueryDto } from './dto/cashier-report-query.dto';
import type { CashierReportResult, TopProductResult } from './types/report-result.types';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  private buildWhere(query: ReportQueryDto) {
    return {
      cancelledAt: null,
      ...(query.branchId && { branchId: query.branchId }),
      ...((query.from || query.to) && {
        createdAt: {
          ...(query.from && { gte: new Date(dateRangeFrom(query.from)) }),
          ...(query.to && { lte: new Date(dateRangeTo(query.to)) }),
        },
      }),
    };
  }

  async getSales(query: ReportQueryDto) {
    const orders = await this.prisma.order.findMany({
      where: this.buildWhere(query),
      select: { total: true, orderType: true },
    });

    const total = orders.reduce((sum, o) => sum + o.total.toNumber(), 0);
    const count = orders.length;
    const avg = count > 0 ? total / count : 0;

    const dineIn = orders.filter((o) => o.orderType === 'dine_in');
    const takeaway = orders.filter((o) => o.orderType === 'takeaway');

    return {
      total,
      count,
      avg,
      by_order_type: {
        dine_in: {
          total: dineIn.reduce((sum, o) => sum + o.total.toNumber(), 0),
          count: dineIn.length,
        },
        takeaway: {
          total: takeaway.reduce((sum, o) => sum + o.total.toNumber(), 0),
          count: takeaway.length,
        },
      },
    };
  }

  async getDaily(query: ReportQueryDto): Promise<{ date: string; total: number }[]> {
    const orders = await this.prisma.order.findMany({
      where: this.buildWhere(query),
      select: { total: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    const map: Record<string, number> = {};
    for (const order of orders) {
      const localDate = toBoliviaDate(order.createdAt);
      const date = localDate.toISOString().split('T')[0];
      map[date] = (map[date] ?? 0) + order.total.toNumber();
    }

    return Object.entries(map)
      .map(([date, total]) => ({ date, total }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  async getTopProducts(query: ReportQueryDto): Promise<TopProductResult[]> {
    const items = await this.prisma.orderItem.findMany({
      where: { order: this.buildWhere(query) },
      include: { variant: { include: { product: true } } },
    });

    const map: Record<string, TopProductResult> = {};
    for (const item of items) {
      const { variant } = item;
      if (!map[variant.id]) {
        map[variant.id] = {
          variant_id: variant.id,
          product_name: variant.product.name,
          variant_name: variant.name,
          category: variant.product.category,
          qty: 0,
          revenue: 0,
        };
      }
      map[variant.id].qty += item.qty;
      map[variant.id].revenue += item.unitPrice.toNumber() * item.qty - item.discountApplied.toNumber();
    }

    return Object.values(map).sort((a, b) => b.qty - a.qty);
  }

  async getCashiers(query: CashierReportQueryDto): Promise<CashierReportResult[]> {
    const orders = await this.prisma.order.findMany({
      where: {
        ...this.buildWhere(query),
        ...(query.cashierId && { cashierId: query.cashierId }),
      },
      include: {
        cashier: true,
        items: { include: { variant: { include: { product: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const cashierMap: Record<string, CashierReportResult> = {};
    for (const order of orders) {
      const cid = order.cashierId;
      if (!cashierMap[cid]) {
        cashierMap[cid] = {
          cashier_id: cid,
          cashier_name: order.cashier?.fullName ?? 'Desconocido',
          orders: 0,
          total: 0,
          items: [],
        };
      }
      cashierMap[cid].orders += 1;
      cashierMap[cid].total += order.total.toNumber();

      for (const item of order.items) {
        const { variant } = item;
        const revenue = item.unitPrice.toNumber() * item.qty - item.discountApplied.toNumber();
        const existing = cashierMap[cid].items.find((i) => i.variant_id === variant.id);
        if (existing) {
          existing.qty += item.qty;
          existing.revenue += revenue;
        } else {
          cashierMap[cid].items.push({
            variant_id: variant.id,
            product_name: variant.product.name,
            variant_name: variant.name,
            category: variant.product.category,
            qty: item.qty,
            revenue,
          });
        }
      }
    }

    return Object.values(cashierMap).sort((a, b) => b.total - a.total);
  }
}

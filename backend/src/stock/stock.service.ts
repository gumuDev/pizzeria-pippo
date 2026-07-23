import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { ListStockQueryDto } from './dto/list-stock-query.dto';
import type { ListAlertsQueryDto } from './dto/list-alerts-query.dto';
import type { ListMovementsQueryDto } from './dto/list-movements-query.dto';
import type { PurchaseStockDto } from './dto/purchase-stock.dto';
import type { AdjustStockDto } from './dto/adjust-stock.dto';
import type { StockListResult, StockRow } from './types/stock-row.types';
import type { MovementListResult, MovementRow } from './types/movement.types';

@Injectable()
export class StockService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListStockQueryDto): Promise<StockListResult> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const where = { ...(query.branchId ? { branchId: query.branchId } : {}), ingredient: { isActive: true } };

    const [rows, total] = await Promise.all([
      this.prisma.branchStock.findMany({
        where,
        orderBy: { ingredientId: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { ingredient: true, branch: true },
      }),
      this.prisma.branchStock.count({ where }),
    ]);

    return { data: rows.map((row) => this.mapStockRow(row)), total, page, pageSize };
  }

  async getAlerts(query: ListAlertsQueryDto): Promise<StockRow[]> {
    const where = { ...(query.branchId ? { branchId: query.branchId } : {}), ingredient: { isActive: true } };
    const rows = await this.prisma.branchStock.findMany({
      where,
      include: { ingredient: true, branch: true },
    });
    return rows.filter((r) => r.quantity.toNumber() < r.minQuantity.toNumber()).map((row) => this.mapStockRow(row));
  }

  async getMovements(query: ListMovementsQueryDto): Promise<MovementListResult> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const where = {
      ...(query.branchId ? { branchId: query.branchId } : {}),
      ...(query.ingredientId ? { ingredientId: query.ingredientId } : {}),
      ...(query.type ? { type: query.type } : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.stockMovement.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { ingredient: true, branch: true },
      }),
      this.prisma.stockMovement.count({ where }),
    ]);

    return {
      data: rows.map((row): MovementRow => ({
        id: row.id,
        branch_id: row.branchId,
        ingredient_id: row.ingredientId,
        quantity: row.quantity.toNumber(),
        type: row.type,
        notes: row.notes,
        created_at: row.createdAt.toISOString(),
        ingredients: { id: row.ingredient.id, name: row.ingredient.name, unit: row.ingredient.unit },
        branches: { id: row.branch.id, name: row.branch.name },
      })),
      total,
      page,
      pageSize,
    };
  }

  async purchase(dto: PurchaseStockDto, userId: string): Promise<void> {
    const existing = await this.prisma.branchStock.findFirst({
      where: { branchId: dto.branch_id, ingredientId: dto.ingredient_id },
    });

    if (existing) {
      await this.prisma.branchStock.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity.toNumber() + dto.quantity },
      });
    } else {
      await this.prisma.branchStock.create({
        data: {
          branchId: dto.branch_id,
          ingredientId: dto.ingredient_id,
          quantity: dto.quantity,
          minQuantity: dto.min_quantity ?? 0,
        },
      });
    }

    await this.prisma.stockMovement.create({
      data: {
        branchId: dto.branch_id,
        ingredientId: dto.ingredient_id,
        quantity: dto.quantity,
        type: 'compra',
        createdBy: userId,
      },
    });
  }

  async adjust(dto: AdjustStockDto, userId: string): Promise<{ difference: number }> {
    const existing = await this.prisma.branchStock.findFirst({
      where: { branchId: dto.branch_id, ingredientId: dto.ingredient_id },
    });

    const difference = dto.real_quantity - (existing?.quantity.toNumber() ?? 0);

    if (existing) {
      await this.prisma.branchStock.update({ where: { id: existing.id }, data: { quantity: dto.real_quantity } });
    } else {
      await this.prisma.branchStock.create({
        data: {
          branchId: dto.branch_id,
          ingredientId: dto.ingredient_id,
          quantity: dto.real_quantity,
          minQuantity: 0,
        },
      });
    }

    await this.prisma.stockMovement.create({
      data: {
        branchId: dto.branch_id,
        ingredientId: dto.ingredient_id,
        quantity: difference,
        type: 'ajuste',
        notes: dto.notes ?? null,
        createdBy: userId,
      },
    });

    return { difference };
  }

  async updateMinQuantity(id: string, minQuantity: number): Promise<void> {
    await this.prisma.branchStock.update({ where: { id }, data: { minQuantity } });
  }

  private mapStockRow(row: {
    id: string;
    branchId: string;
    ingredientId: string;
    quantity: { toNumber(): number };
    minQuantity: { toNumber(): number };
    ingredient: { id: string; name: string; unit: string };
    branch: { id: string; name: string };
  }): StockRow {
    return {
      id: row.id,
      branch_id: row.branchId,
      ingredient_id: row.ingredientId,
      quantity: row.quantity.toNumber(),
      min_quantity: row.minQuantity.toNumber(),
      ingredients: { id: row.ingredient.id, name: row.ingredient.name, unit: row.ingredient.unit },
      branches: { id: row.branch.id, name: row.branch.name },
    };
  }
}

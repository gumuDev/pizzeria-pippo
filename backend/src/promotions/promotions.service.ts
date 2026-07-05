import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { getActivePromotions } from '../orders/lib/promotions-engine';
import type { ListPromotionsQueryDto } from './dto/list-promotions-query.dto';
import type { CreatePromotionDto } from './dto/create-promotion.dto';
import type { UpdatePromotionDto } from './dto/update-promotion.dto';
import type { PatchPromotionDto } from './dto/patch-promotion.dto';
import type { PromotionResult } from './types/promotion-result.types';

function toDateOnlyString(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

@Injectable()
export class PromotionsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListPromotionsQueryDto): Promise<PromotionResult[]> {
    const showInactive = query.showInactive === 'true';

    const rows = await this.prisma.promotion.findMany({
      where: showInactive ? {} : { isActive: true },
      orderBy: { name: 'asc' },
      include: { rules: true },
    });

    let promotions = rows.map((row) => this.mapPromotion(row));

    if (query.branchId && query.date) {
      promotions = getActivePromotions(promotions, query.branchId, query.date);
    }

    return promotions;
  }

  async getById(id: string): Promise<PromotionResult> {
    const row = await this.prisma.promotion.findUnique({ where: { id }, include: { rules: true } });
    if (!row) throw new NotFoundException('Promoción no encontrada');
    return this.mapPromotion(row);
  }

  async create(dto: CreatePromotionDto): Promise<{ id: string }> {
    const promo = await this.prisma.promotion.create({
      data: {
        name: dto.name,
        type: dto.type,
        daysOfWeek: dto.days_of_week,
        startDate: new Date(dto.start_date),
        endDate: new Date(dto.end_date),
        branchId: dto.branch_id || null,
        active: true,
      },
    });

    if (dto.rules?.length) {
      await this.prisma.promotionRule.createMany({
        data: dto.rules.map((r) => ({
          promotionId: promo.id,
          variantId: r.variant_id ?? null,
          buyQty: r.buy_qty ?? null,
          getQty: r.get_qty ?? null,
          discountPercent: r.discount_percent ?? null,
          comboPrice: r.combo_price ?? null,
          category: r.category ?? null,
          variantSize: r.variant_size ?? null,
        })),
      });
    }

    return { id: promo.id };
  }

  async update(id: string, dto: UpdatePromotionDto): Promise<void> {
    await this.prisma.promotion.update({
      where: { id },
      data: {
        name: dto.name,
        type: dto.type,
        daysOfWeek: dto.days_of_week,
        startDate: new Date(dto.start_date),
        endDate: new Date(dto.end_date),
        branchId: dto.branch_id || null,
        active: dto.active,
      },
    });

    // Reglas: config reemplazable, se borra y recrea
    await this.prisma.promotionRule.deleteMany({ where: { promotionId: id } });

    if (dto.rules?.length) {
      await this.prisma.promotionRule.createMany({
        data: dto.rules.map((r) => ({
          promotionId: id,
          variantId: r.variant_id ?? null,
          buyQty: r.buy_qty ?? null,
          getQty: r.get_qty ?? null,
          discountPercent: r.discount_percent ?? null,
          comboPrice: r.combo_price ?? null,
          category: r.category ?? null,
          variantSize: r.variant_size ?? null,
        })),
      });
    }
  }

  async patch(id: string, dto: PatchPromotionDto): Promise<void> {
    // Acepta is_active (soft-delete) y/o active (toggle POS) — nunca un update completo
    await this.prisma.promotion.update({
      where: { id },
      data: {
        ...(dto.is_active !== undefined ? { isActive: dto.is_active } : {}),
        ...(dto.active !== undefined ? { active: dto.active } : {}),
      },
    });
  }

  async remove(id: string): Promise<void> {
    await this.prisma.promotion.update({ where: { id }, data: { isActive: false } });
  }

  private mapPromotion(row: {
    id: string;
    name: string;
    type: string;
    daysOfWeek: number[];
    startDate: Date;
    endDate: Date;
    branchId: string | null;
    active: boolean;
    isActive: boolean;
    createdAt: Date;
    rules: {
      id: string;
      promotionId: string;
      variantId: string | null;
      buyQty: number | null;
      getQty: number | null;
      discountPercent: { toNumber(): number } | null;
      comboPrice: { toNumber(): number } | null;
      category: string | null;
      variantSize: string | null;
    }[];
  }): PromotionResult {
    return {
      id: row.id,
      name: row.name,
      type: row.type,
      days_of_week: row.daysOfWeek,
      start_date: toDateOnlyString(row.startDate),
      end_date: toDateOnlyString(row.endDate),
      branch_id: row.branchId,
      active: row.active,
      is_active: row.isActive,
      created_at: row.createdAt.toISOString(),
      promotion_rules: row.rules.map((r) => ({
        id: r.id,
        promotion_id: r.promotionId,
        variant_id: r.variantId,
        buy_qty: r.buyQty,
        get_qty: r.getQty,
        discount_percent: r.discountPercent?.toNumber() ?? null,
        combo_price: r.comboPrice?.toNumber() ?? null,
        category: r.category,
        variant_size: r.variantSize,
      })),
    };
  }
}

import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PromotionsService } from '../promotions/promotions.service';
import { LowStockAlertService } from '../notifications/low-stock-alert.service';
import { applyPromotions, getActivePromotions, getCartTotal } from './lib/promotions-engine';
import { computeStockDeductions } from './lib/order-stock';
import { dateRangeFrom, dateRangeTo, todayInBolivia } from '../common/utils/timezone';
import type { CartItem, Promotion } from './lib/promotions-engine';
import type { RecipeRow, StockItem } from './lib/order-stock';
import type { CreateOrderDto } from './dto/create-order.dto';
import type { CurrentUserPayload } from '../auth/types/jwt.types';
import type { CreateOrderResult } from './types/create-order-result.types';
import type { DayOrderResult } from './types/day-order-result.types';

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly promotionsService: PromotionsService,
    private readonly lowStockAlertService: LowStockAlertService,
  ) {}

  async create(dto: CreateOrderDto, user: CurrentUserPayload): Promise<CreateOrderResult> {
    // 1. Fetch variants (including mixed-pizza flavors) with prices, recipes and product info
    const flavorVariantIds = dto.items.flatMap((i) => (i.flavors ?? []).map((f) => f.variant_id));
    const variantIds = Array.from(new Set(dto.items.map((i) => i.variant_id).concat(flavorVariantIds)));

    const variants = await this.prisma.productVariant.findMany({
      where: { id: { in: variantIds } },
      include: { branchPrices: true, recipes: true, product: true },
    });
    const variantById = new Map(variants.map((v) => [v.id, v]));

    // 2. Server-side price resolution — never trust client prices
    const cart: CartItem[] = dto.items.map((i) => {
      const variant = variantById.get(i.variant_id);
      if (!variant || !variant.isActive || !variant.product.isActive) {
        throw new BadRequestException('Hay productos no disponibles en el pedido');
      }
      const override = variant.branchPrices.find((bp) => bp.branchId === dto.branch_id);
      const productType = variant.product.productType ?? 'made';
      if (!override && productType !== 'resale') {
        throw new BadRequestException(`"${variant.product.name}" no tiene precio en esta sucursal`);
      }
      return {
        variant_id: i.variant_id,
        qty: i.qty,
        unit_price: override ? override.price.toNumber() : variant.basePrice.toNumber(),
        product_name: variant.product.name,
        variant_name: variant.name,
        category: variant.product.category,
        flavors: i.flavors?.length
          ? i.flavors.map((f) => ({ variant_id: f.variant_id, product_name: f.product_name ?? '', proportion: f.proportion }))
          : undefined,
      };
    });

    // 3. Recompute promotions and totals server-side (reuses PromotionsService's
    // query + mapping instead of duplicating it — same "all non-deleted promotions" set)
    const allPromotions = (await this.promotionsService.list({})) as unknown as Promotion[];
    const activePromotions = getActivePromotions(allPromotions, dto.branch_id, todayInBolivia());
    const discounted = applyPromotions(cart, activePromotions);
    const serverTotal = round2(getCartTotal(discounted));

    // 4. The client total must match — a mismatch means prices/promos changed (or were tampered)
    if (Math.abs(serverTotal - dto.total) > 0.01) {
      throw new ConflictException('Los precios o promociones cambiaron. Actualizá el catálogo e intentá de nuevo.');
    }

    // 5. Compute stock deductions (pure, unit-tested separately)
    const recipesByVariant: Record<string, RecipeRow[]> = {};
    for (const v of variants) {
      recipesByVariant[v.id] = v.recipes.map((r) => ({
        ingredient_id: r.ingredientId,
        quantity: r.quantity.toNumber(),
        apply_condition: r.applyCondition,
      }));
    }

    const stockItems: StockItem[] = discounted.map((d) => ({
      variant_id: d.variant_id,
      qty_physical: d.qty_physical,
      product_type: variantById.get(d.variant_id)?.product.productType ?? 'made',
      flavors: d.flavors?.map((f) => ({ variant_id: f.variant_id, proportion: f.proportion })),
    }));
    const deductions = computeStockDeductions(stockItems, recipesByVariant, dto.order_type);

    // 6. Apply order + items + flavors + stock in ONE transaction — reuses the
    // existing create_order_atomic SQL function (see plan doc for why this
    // isn't reimplemented in Prisma: advisory lock + idempotency race handling).
    const today = todayInBolivia();
    const payload = {
      branch_id: dto.branch_id,
      cashier_id: user.id,
      total: serverTotal,
      payment_method: dto.payment_method ?? null,
      order_type: dto.order_type,
      idempotency_key: dto.idempotency_key ?? null,
      day_start: dateRangeFrom(today),
      day_end: dateRangeTo(today),
      items: discounted.map((d) => ({
        variant_id: d.variant_id,
        qty: d.qty,
        qty_physical: d.qty_physical,
        unit_price: d.unit_price,
        discount_applied: round2(d.discount_applied),
        promo_label: d.promo_label,
        flavors: (d.flavors ?? []).map((f) => ({ variant_id: f.variant_id, proportion: f.proportion })),
      })),
      ...deductions,
    };

    const rows = await this.prisma.$queryRaw<{ create_order_atomic: CreateOrderResult }[]>`
      SELECT public.create_order_atomic(${JSON.stringify(payload)}::jsonb) AS create_order_atomic
    `;
    const result = rows[0].create_order_atomic;

    // 7. Low-stock alert — fire-and-forget, outside the "transaction" (best-effort)
    if (user.business_id && (deductions.ingredient_deductions.length > 0 || deductions.resale_deductions.length > 0)) {
      void this.lowStockAlertService.checkAndNotify(
        user.business_id,
        dto.branch_id,
        deductions.ingredient_deductions.map((d) => d.ingredient_id),
        deductions.resale_deductions.map((d) => d.variant_id),
      );
    }

    return result;
  }

  async getDayOrders(branchId: string, date?: string): Promise<DayOrderResult[]> {
    const day = date ?? todayInBolivia();

    const orders = await this.prisma.order.findMany({
      where: {
        branchId,
        createdAt: { gte: new Date(dateRangeFrom(day)), lte: new Date(dateRangeTo(day)) },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        items: { include: { variant: { include: { product: true } } } },
      },
    });

    return orders.map((order) => ({
      id: order.id,
      daily_number: order.dailyNumber,
      created_at: order.createdAt.toISOString(),
      total: order.total.toNumber(),
      kitchen_status: order.kitchenStatus,
      payment_method: order.paymentMethod,
      order_type: order.orderType,
      cancelled_at: order.cancelledAt?.toISOString() ?? null,
      order_items: order.items.map((item) => ({
        qty: item.qty,
        product_variants: item.variant
          ? { name: item.variant.name, products: item.variant.product ? { name: item.variant.product.name } : null }
          : null,
      })),
    }));
  }

  async markReady(orderId: string, user: CurrentUserPayload): Promise<void> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { branchId: true, cancelledAt: true },
    });
    if (!order) throw new NotFoundException('Orden no encontrada');
    if (order.cancelledAt) throw new ConflictException('La orden está anulada');
    if (user.role !== 'admin' && user.branch_id !== order.branchId) {
      throw new ForbiddenException('No tenés permiso para esta orden');
    }

    await this.prisma.order.update({ where: { id: orderId }, data: { kitchenStatus: 'ready' } });
  }
}

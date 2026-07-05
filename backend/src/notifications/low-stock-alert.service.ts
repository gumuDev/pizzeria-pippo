import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NOTIFICATION_PORT, type NotificationPort } from './notification.port';
import { todayInBolivia } from '../common/utils/timezone';

interface StockAlert {
  name: string;
  current_qty: number;
  min_qty: number;
  unit: string;
  branch_name: string;
}

@Injectable()
export class LowStockAlertService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(NOTIFICATION_PORT) private readonly notificationPort: NotificationPort,
  ) {}

  // Fire-and-forget: checks branch stock after a sale and notifies for any
  // ingredient or resale product below its minimum. Never awaited by the
  // caller (matches the old notifyLowStock behavior — must never block or
  // fail the sale).
  async checkAndNotify(
    businessId: string,
    branchId: string,
    ingredientIds: string[],
    resaleVariantIds: string[] = [],
  ): Promise<void> {
    if (!ingredientIds.length && !resaleVariantIds.length) return;

    try {
      const [ingredientAlerts, resaleAlerts] = await Promise.all([
        this.checkIngredients(branchId, ingredientIds),
        this.checkResaleProducts(branchId, resaleVariantIds),
      ]);

      if (ingredientAlerts.length === 0 && resaleAlerts.length === 0) return;

      const message = this.buildMessage(ingredientAlerts, resaleAlerts);
      await this.notificationPort.send(businessId, message);
    } catch (err) {
      console.error('[LowStockAlertService] checkAndNotify error:', err);
    }
  }

  private async checkIngredients(branchId: string, ingredientIds: string[]): Promise<StockAlert[]> {
    if (!ingredientIds.length) return [];

    const rows = await this.prisma.branchStock.findMany({
      where: { branchId, ingredientId: { in: ingredientIds } },
      include: { ingredient: true, branch: true },
    });

    return rows
      .filter((row) => row.quantity.toNumber() < row.minQuantity.toNumber())
      .map((row) => ({
        name: row.ingredient.name,
        current_qty: row.quantity.toNumber(),
        min_qty: row.minQuantity.toNumber(),
        unit: row.ingredient.unit,
        branch_name: row.branch.name,
      }));
  }

  private async checkResaleProducts(branchId: string, variantIds: string[]): Promise<StockAlert[]> {
    if (!variantIds.length) return [];

    const rows = await this.prisma.branchProductStock.findMany({
      where: { branchId, variantId: { in: variantIds } },
      include: { variant: { include: { product: true } }, branch: true },
    });

    return rows
      .filter((row) => row.quantity.toNumber() < row.minQuantity.toNumber())
      .map((row) => ({
        name: `${row.variant.product.name} (${row.variant.name})`,
        current_qty: row.quantity.toNumber(),
        min_qty: row.minQuantity.toNumber(),
        unit: 'unidades',
        branch_name: row.branch.name,
      }));
  }

  private buildMessage(ingredientAlerts: StockAlert[], resaleAlerts: StockAlert[]): string {
    const byBranch = new Map<string, { ingredients: StockAlert[]; resale: StockAlert[] }>();
    for (const alert of ingredientAlerts) {
      const entry = byBranch.get(alert.branch_name) ?? { ingredients: [], resale: [] };
      entry.ingredients.push(alert);
      byBranch.set(alert.branch_name, entry);
    }
    for (const alert of resaleAlerts) {
      const entry = byBranch.get(alert.branch_name) ?? { ingredients: [], resale: [] };
      entry.resale.push(alert);
      byBranch.set(alert.branch_name, entry);
    }

    const dateStr = todayInBolivia().split('-').reverse().join('/');
    const now = new Date();
    const timeStr = new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString().split('T')[1].slice(0, 5);

    const formatLines = (items: StockAlert[]) =>
      items.map((a) => `• ${a.name}: ${a.current_qty} ${a.unit} (mínimo: ${a.min_qty} ${a.unit})`).join('\n');

    return Array.from(byBranch.entries())
      .map(([branch, { ingredients, resale }]) => {
        const sections = [
          ingredients.length ? `*Insumos*\n${formatLines(ingredients)}` : null,
          resale.length ? `*Productos*\n${formatLines(resale)}` : null,
        ].filter(Boolean);
        return `⚠️ *Stock bajo — ${branch}*\n\n${sections.join('\n\n')}\n\n_Pizzería Pippo — ${dateStr} ${timeStr}_`;
      })
      .join('\n\n---\n\n');
  }
}

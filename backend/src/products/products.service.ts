import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { Product, ProductVariant } from '@pippo/shared';
import type { ListProductsQueryDto } from './dto/list-products-query.dto';
import type { CreateProductDto } from './dto/create-product.dto';
import type { UpdateProductDto } from './dto/update-product.dto';
import type { ProductListResult } from './types/product-list-result.types';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListProductsQueryDto): Promise<ProductListResult> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const showInactive = query.showInactive === 'true';

    const where = {
      ...(showInactive ? {} : { isActive: true }),
      ...(query.search ? { name: { contains: query.search, mode: 'insensitive' as const } } : {}),
      ...(query.category ? { category: query.category } : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { variants: true },
      }),
      this.prisma.product.count({ where }),
    ]);

    return { data: rows.map((row) => this.mapProduct(row)), total, page, pageSize };
  }

  async getDetail(id: string): Promise<Product | null> {
    const row = await this.prisma.product.findUnique({ where: { id }, include: { variants: true } });
    return row ? this.mapProduct(row) : null;
  }

  async getVariantsWithDetails(productId: string): Promise<ProductVariant[]> {
    const variants = await this.prisma.productVariant.findMany({
      where: { productId },
      include: { branchPrices: true, recipes: true },
    });

    return variants.map((v) => ({
      id: v.id,
      product_id: v.productId,
      name: v.name,
      base_price: v.basePrice.toNumber(),
      created_at: v.createdAt.toISOString(),
      is_active: v.isActive,
      branch_prices: v.branchPrices.map((bp) => ({
        branch_id: bp.branchId,
        variant_id: bp.variantId,
        price: bp.price.toNumber(),
      })),
      recipes: v.recipes.map((r) => ({
        ingredient_id: r.ingredientId,
        quantity: r.quantity.toNumber(),
        apply_condition: r.applyCondition as never,
      })),
    }));
  }

  async create(dto: CreateProductDto): Promise<{ id: string }> {
    const product = await this.prisma.product.create({
      data: {
        name: dto.name,
        category: dto.category,
        description: dto.description,
        imageUrl: dto.image_url,
        productType: dto.product_type ?? 'made',
      },
    });

    for (const variant of dto.variants) {
      const createdVariant = await this.prisma.productVariant.create({
        data: { productId: product.id, name: variant.name, basePrice: variant.base_price },
      });
      await this.replaceVariantExtras(createdVariant.id, variant);
    }

    return { id: product.id };
  }

  async update(id: string, dto: UpdateProductDto): Promise<void> {
    await this.prisma.product.update({
      where: { id },
      data: {
        name: dto.name,
        category: dto.category,
        description: dto.description,
        imageUrl: dto.image_url,
        ...(dto.product_type ? { productType: dto.product_type } : {}),
      },
    });

    const existingVariants = await this.prisma.productVariant.findMany({
      where: { productId: id },
      select: { id: true, name: true },
    });
    const existingMap = new Map(existingVariants.map((v) => [v.name, v.id]));
    const incomingNames = new Set(dto.variants.map((v) => v.name));

    // Soft-deactivate variants that were removed (can't delete if referenced by order_items)
    for (const existing of existingVariants) {
      if (!incomingNames.has(existing.name)) {
        await this.prisma.productVariant.update({ where: { id: existing.id }, data: { isActive: false } });
      }
    }

    for (const variant of dto.variants) {
      let variantId = existingMap.get(variant.name);

      if (variantId) {
        await this.prisma.productVariant.update({
          where: { id: variantId },
          data: { basePrice: variant.base_price, isActive: true },
        });
      } else {
        const created = await this.prisma.productVariant.create({
          data: { productId: id, name: variant.name, basePrice: variant.base_price },
        });
        variantId = created.id;
      }

      await this.replaceVariantExtras(variantId, variant);
    }
  }

  async setActive(id: string, isActive: boolean): Promise<void> {
    await this.prisma.productVariant.updateMany({ where: { productId: id }, data: { isActive } });
    await this.prisma.product.update({ where: { id }, data: { isActive } });
  }

  async softDelete(id: string): Promise<void> {
    await this.setActive(id, false);
  }

  private async replaceVariantExtras(
    variantId: string,
    variant: { branch_prices: { branch_id: string; price: number }[]; recipes: { ingredient_id: string; quantity: number; apply_condition?: string }[] },
  ): Promise<void> {
    // recipes and branch_prices are config — safe to delete and recreate
    await this.prisma.branchPrice.deleteMany({ where: { variantId } });
    await this.prisma.recipe.deleteMany({ where: { variantId } });

    if (variant.branch_prices.length) {
      await this.prisma.branchPrice.createMany({
        data: variant.branch_prices.map((bp) => ({ branchId: bp.branch_id, variantId, price: bp.price })),
      });
    }

    if (variant.recipes.length) {
      await this.prisma.recipe.createMany({
        data: variant.recipes.map((r) => ({
          variantId,
          ingredientId: r.ingredient_id,
          quantity: r.quantity,
          applyCondition: r.apply_condition ?? 'always',
        })),
      });
    }
  }

  private mapProduct(row: {
    id: string;
    name: string;
    category: string;
    description: string | null;
    imageUrl: string | null;
    productType: string;
    createdAt: Date;
    isActive: boolean;
    variants: { id: string; productId: string; name: string; basePrice: { toNumber(): number }; createdAt: Date; isActive: boolean }[];
  }): Product {
    return {
      id: row.id,
      name: row.name,
      category: row.category as never,
      description: row.description,
      image_url: row.imageUrl,
      product_type: row.productType as never,
      created_at: row.createdAt.toISOString(),
      is_active: row.isActive,
      product_variants: row.variants.map((v) => ({
        id: v.id,
        product_id: v.productId,
        name: v.name,
        base_price: v.basePrice.toNumber(),
        created_at: v.createdAt.toISOString(),
        is_active: v.isActive,
      })),
    };
  }
}

import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { ListIngredientsQueryDto } from './dto/list-ingredients-query.dto';
import type { CreateIngredientDto } from './dto/create-ingredient.dto';
import type { UpdateIngredientDto } from './dto/update-ingredient.dto';
import type { IngredientListResult } from './types/ingredient-list-result.types';

@Injectable()
export class IngredientsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListIngredientsQueryDto): Promise<IngredientListResult> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const showInactive = query.showInactive === 'true';

    const where = {
      ...(showInactive ? {} : { isActive: true }),
      ...(query.search ? { name: { contains: query.search, mode: 'insensitive' as const } } : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.ingredient.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.ingredient.count({ where }),
    ]);

    return {
      data: rows.map((row) => ({
        id: row.id,
        name: row.name,
        unit: row.unit as never,
        created_at: row.createdAt.toISOString(),
        is_active: row.isActive,
      })),
      total,
      page,
      pageSize,
    };
  }

  async create(dto: CreateIngredientDto) {
    const row = await this.prisma.ingredient.create({
      data: { name: dto.name, unit: dto.unit },
    });
    return { id: row.id };
  }

  async update(id: string, dto: UpdateIngredientDto): Promise<void> {
    if (dto.is_active === false) {
      await this.assertNotUsedInActiveRecipes(id);
    }
    await this.prisma.ingredient.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.unit !== undefined && { unit: dto.unit }),
        ...(dto.is_active !== undefined && { isActive: dto.is_active }),
      },
    });
  }

  async softDelete(id: string): Promise<void> {
    await this.assertNotUsedInActiveRecipes(id);
    await this.prisma.ingredient.update({ where: { id }, data: { isActive: false } });
  }

  private async assertNotUsedInActiveRecipes(ingredientId: string): Promise<void> {
    const count = await this.prisma.recipe.count({
      where: { ingredientId, variant: { isActive: true } },
    });
    if (count > 0) {
      throw new ConflictException(
        `Este insumo está siendo usado en ${count} receta(s) activa(s). Desactiva los productos correspondientes antes de continuar.`,
      );
    }
  }
}

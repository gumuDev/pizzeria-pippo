import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { VariantTypeInUseException } from '../common/exceptions/variant-type-in-use.exception';
import type { VariantType } from '@pippo/shared';
import type { ListVariantTypesQueryDto } from './dto/list-variant-types-query.dto';
import type { CreateVariantTypeDto } from './dto/create-variant-type.dto';
import type { UpdateVariantTypeDto } from './dto/update-variant-type.dto';

@Injectable()
export class VariantTypesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListVariantTypesQueryDto): Promise<VariantType[]> {
    const onlyActive = query.onlyActive !== 'false';

    const rows = await this.prisma.variantType.findMany({
      where: onlyActive ? { isActive: true } : {},
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((row) => this.mapVariantType(row));
  }

  async create(dto: CreateVariantTypeDto): Promise<VariantType> {
    const row = await this.prisma.variantType.create({
      data: { name: dto.name.trim() },
    });
    return this.mapVariantType(row);
  }

  async update(id: string, dto: UpdateVariantTypeDto): Promise<VariantType> {
    const row = await this.prisma.variantType.update({
      where: { id },
      data: { name: dto.name.trim() },
    });
    return this.mapVariantType(row);
  }

  async setActive(id: string, isActive: boolean): Promise<VariantType> {
    if (!isActive) {
      await this.assertNotInUse(id);
    }
    const row = await this.prisma.variantType.update({ where: { id }, data: { isActive } });
    return this.mapVariantType(row);
  }

  private async assertNotInUse(id: string): Promise<void> {
    const variantType = await this.prisma.variantType.findUnique({ where: { id } });
    if (!variantType) {
      throw new NotFoundException('Tipo de variante no encontrado');
    }

    const count = await this.prisma.productVariant.count({
      where: { name: variantType.name, isActive: true },
    });

    if (count > 0) {
      throw new VariantTypeInUseException(
        `Hay ${count} producto(s) usando este tipo. Desactivá las variantes primero.`,
        count,
      );
    }
  }

  private mapVariantType(row: {
    id: string;
    name: string;
    sortOrder: number;
    isActive: boolean;
    createdAt: Date | null;
  }): VariantType {
    return {
      id: row.id,
      name: row.name,
      sort_order: row.sortOrder,
      is_active: row.isActive,
      created_at: row.createdAt ? row.createdAt.toISOString() : new Date().toISOString(),
    };
  }
}

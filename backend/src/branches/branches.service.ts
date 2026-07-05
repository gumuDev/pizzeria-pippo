import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BranchHasCashiersException } from '../common/exceptions/branch-has-cashiers.exception';
import type { Branch } from '@pippo/shared';
import type { CurrentUserPayload } from '../auth/types/jwt.types';
import type { ListBranchesQueryDto } from './dto/list-branches-query.dto';
import type { CreateBranchDto } from './dto/create-branch.dto';
import type { UpdateBranchDto } from './dto/update-branch.dto';

@Injectable()
export class BranchesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListBranchesQueryDto, user: CurrentUserPayload): Promise<Branch[]> {
    const showInactive = query.showInactive === 'true';

    const where = {
      ...(showInactive ? {} : { isActive: true }),
      // Réplica de la RLS real: admin ve todas, el resto solo su propia sucursal
      ...(user.role === 'admin' ? {} : { id: user.branch_id ?? '' }),
    };

    const rows = await this.prisma.branch.findMany({ where, orderBy: { createdAt: 'asc' } });
    return rows.map((row) => this.mapBranch(row));
  }

  async create(dto: CreateBranchDto): Promise<Branch> {
    const row = await this.prisma.branch.create({ data: { name: dto.name, address: dto.address } });
    return this.mapBranch(row);
  }

  async update(id: string, dto: UpdateBranchDto): Promise<void> {
    await this.prisma.branch.update({ where: { id }, data: { name: dto.name, address: dto.address } });
  }

  async setActive(id: string, isActive: boolean): Promise<void> {
    if (!isActive) {
      await this.assertNoActiveCashiers(id);
    }
    await this.prisma.branch.update({ where: { id }, data: { isActive } });
  }

  async remove(id: string): Promise<void> {
    await this.assertNoActiveCashiers(id);
    await this.prisma.branch.update({ where: { id }, data: { isActive: false } });
  }

  private async assertNoActiveCashiers(branchId: string): Promise<void> {
    const cashiers = await this.prisma.profile.findMany({
      where: { branchId, role: 'cajero' },
      select: { id: true, fullName: true },
    });

    if (cashiers.length > 0) {
      throw new BranchHasCashiersException(
        `Hay ${cashiers.length} cajero(s) asignados a esta sucursal. Desactívalos o reasígnalos antes de continuar.`,
        cashiers.map((c) => ({ id: c.id, full_name: c.fullName })),
      );
    }
  }

  private mapBranch(row: { id: string; name: string; address: string | null; createdAt: Date; isActive: boolean }): Branch {
    return {
      id: row.id,
      name: row.name,
      address: row.address,
      created_at: row.createdAt.toISOString(),
      is_active: row.isActive,
    };
  }
}

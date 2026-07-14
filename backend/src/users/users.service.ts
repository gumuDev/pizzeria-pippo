import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PasswordHasherService } from '../auth/password/password-hasher.service';
import type { UserResult } from './types/user-result.types';
import type { CreateUserDto } from './dto/create-user.dto';
import type { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordHasher: PasswordHasherService,
  ) {}

  async list(): Promise<UserResult[]> {
    const [profiles, orders] = await Promise.all([
      this.prisma.profile.findMany({
        select: { id: true, email: true, fullName: true, role: true, branchId: true, createdAt: true, isBanned: true },
      }),
      this.prisma.order.findMany({ select: { cashierId: true }, distinct: ['cashierId'] }),
    ]);

    const cashierIdsWithOrders = new Set(orders.map((o) => o.cashierId));

    return profiles.map((p) => ({
      id: p.id,
      email: p.email,
      full_name: p.fullName ?? '',
      role: p.role,
      branch_id: p.branchId,
      created_at: p.createdAt.toISOString(),
      is_banned: p.isBanned,
      has_orders: cashierIdsWithOrders.has(p.id),
    }));
  }

  async create(dto: CreateUserDto): Promise<{ id: string }> {
    const passwordHash = await this.passwordHasher.hash(dto.password);

    try {
      const profile = await this.prisma.profile.create({
        data: {
          email: dto.email,
          passwordHash,
          fullName: dto.full_name,
          role: dto.role,
          branchId: dto.branch_id ?? null,
        },
      });
      return { id: profile.id };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Ya existe un usuario con ese correo');
      }
      throw error;
    }
  }

  async update(id: string, dto: UpdateUserDto): Promise<void> {
    const passwordHash = dto.password ? await this.passwordHasher.hash(dto.password) : undefined;

    await this.prisma.profile.update({
      where: { id },
      data: {
        fullName: dto.full_name,
        role: dto.role,
        branchId: dto.branch_id ?? null,
        ...(passwordHash ? { passwordHash } : {}),
      },
    });
  }

  async toggleBan(id: string, banned: boolean): Promise<void> {
    await this.prisma.profile.update({ where: { id }, data: { isBanned: banned } });
  }

  async remove(id: string): Promise<void> {
    const ordersCount = await this.prisma.order.count({ where: { cashierId: id } });
    if (ordersCount > 0) {
      throw new ConflictException(
        'No se puede eliminar: el usuario tiene ventas registradas. Desactiva la cuenta en su lugar.',
      );
    }
    await this.prisma.profile.delete({ where: { id } });
  }
}

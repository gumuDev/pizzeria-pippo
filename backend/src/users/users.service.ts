import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AUTH_ADMIN_PORT, type AuthAdminPort } from './auth-admin/auth-admin.port';
import type { UserResult } from './types/user-result.types';
import type { CreateUserDto } from './dto/create-user.dto';
import type { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(AUTH_ADMIN_PORT) private readonly authAdmin: AuthAdminPort,
  ) {}

  async list(): Promise<UserResult[]> {
    const [authUsers, profiles, orders] = await Promise.all([
      this.authAdmin.listUsers(),
      this.prisma.profile.findMany({ select: { id: true, fullName: true, role: true, branchId: true } }),
      this.prisma.order.findMany({ select: { cashierId: true }, distinct: ['cashierId'] }),
    ]);

    const profileMap = new Map(profiles.map((p) => [p.id, p]));
    const cashierIdsWithOrders = new Set(orders.map((o) => o.cashierId));

    return authUsers.map((u) => {
      const profile = profileMap.get(u.id);
      const metadata = u.user_metadata ?? {};
      return {
        id: u.id,
        email: u.email ?? '',
        full_name: profile?.fullName ?? (metadata.full_name as string | undefined) ?? '',
        role: profile?.role ?? (metadata.role as string | undefined) ?? 'cajero',
        branch_id: profile?.branchId ?? null,
        created_at: u.created_at,
        is_banned: !!u.banned_until,
        has_orders: cashierIdsWithOrders.has(u.id),
      };
    });
  }

  async create(dto: CreateUserDto): Promise<{ id: string }> {
    const authUser = await this.authAdmin.createUser({
      email: dto.email,
      password: dto.password,
      metadata: { full_name: dto.full_name, role: dto.role },
    });

    await this.prisma.profile.upsert({
      where: { id: authUser.id },
      create: { id: authUser.id, fullName: dto.full_name, role: dto.role, branchId: dto.branch_id ?? null },
      update: { fullName: dto.full_name, role: dto.role, branchId: dto.branch_id ?? null },
    });

    return { id: authUser.id };
  }

  async update(id: string, dto: UpdateUserDto): Promise<void> {
    await this.authAdmin.updateUserMetadata(id, { full_name: dto.full_name, role: dto.role });
    await this.prisma.profile.update({
      where: { id },
      data: { fullName: dto.full_name, role: dto.role, branchId: dto.branch_id ?? null },
    });
  }

  async toggleBan(id: string, banned: boolean): Promise<void> {
    await this.authAdmin.setBanned(id, banned);
  }

  async remove(id: string): Promise<void> {
    const ordersCount = await this.prisma.order.count({ where: { cashierId: id } });
    if (ordersCount > 0) {
      throw new ConflictException(
        'No se puede eliminar: el usuario tiene ventas registradas. Desactiva la cuenta en su lugar.',
      );
    }
    // profiles.id tiene FK hacia auth.users.id sin ON DELETE CASCADE — hay que
    // borrar el profile primero o Postgres rechaza el borrado del auth user.
    await this.prisma.profile.delete({ where: { id } });
    await this.authAdmin.deleteUser(id);
  }
}

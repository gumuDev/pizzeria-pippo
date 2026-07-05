import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { UsersService } from './users.service';
import { AUTH_ADMIN_PORT } from './auth-admin/auth-admin.port';
import { PrismaService } from '../prisma/prisma.service';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: {
    profile: { findMany: jest.Mock; upsert: jest.Mock; update: jest.Mock; delete: jest.Mock };
    order: { findMany: jest.Mock; count: jest.Mock };
  };
  let authAdmin: {
    listUsers: jest.Mock;
    createUser: jest.Mock;
    updateUserMetadata: jest.Mock;
    setBanned: jest.Mock;
    deleteUser: jest.Mock;
  };

  beforeEach(async () => {
    prisma = {
      profile: { findMany: jest.fn(), upsert: jest.fn(), update: jest.fn(), delete: jest.fn() },
      order: { findMany: jest.fn(), count: jest.fn() },
    };
    authAdmin = {
      listUsers: jest.fn(),
      createUser: jest.fn(),
      updateUserMetadata: jest.fn(),
      setBanned: jest.fn(),
      deleteUser: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: prisma },
        { provide: AUTH_ADMIN_PORT, useValue: authAdmin },
      ],
    }).compile();

    service = module.get(UsersService);
  });

  describe('list', () => {
    it('combina auth users + profile + has_orders, con fallback a user_metadata', async () => {
      authAdmin.listUsers.mockResolvedValue([
        {
          id: 'u1',
          email: 'a@a.com',
          user_metadata: { full_name: 'Meta Name', role: 'cajero' },
          banned_until: null,
          created_at: '2026-01-01',
        },
        {
          id: 'u2',
          email: 'b@b.com',
          user_metadata: {},
          banned_until: '2100-01-01',
          created_at: '2026-01-02',
        },
      ]);
      prisma.profile.findMany.mockResolvedValue([
        { id: 'u1', fullName: 'Profile Name', role: 'admin', branchId: null },
      ]);
      prisma.order.findMany.mockResolvedValue([{ cashierId: 'u1' }]);

      const result = await service.list();

      expect(result).toEqual([
        {
          id: 'u1',
          email: 'a@a.com',
          full_name: 'Profile Name',
          role: 'admin',
          branch_id: null,
          created_at: '2026-01-01',
          is_banned: false,
          has_orders: true,
        },
        {
          id: 'u2',
          email: 'b@b.com',
          full_name: '',
          role: 'cajero',
          branch_id: null,
          created_at: '2026-01-02',
          is_banned: true,
          has_orders: false,
        },
      ]);
    });
  });

  describe('create', () => {
    it('crea el usuario de auth y hace upsert del profile', async () => {
      authAdmin.createUser.mockResolvedValue({
        id: 'u1',
        email: 'a@a.com',
        user_metadata: {},
        banned_until: null,
        created_at: '2026-01-01',
      });

      const result = await service.create({
        email: 'a@a.com',
        password: 'secret1',
        full_name: 'A',
        role: 'cajero',
        branch_id: 'b1',
      });

      expect(authAdmin.createUser).toHaveBeenCalledWith({
        email: 'a@a.com',
        password: 'secret1',
        metadata: { full_name: 'A', role: 'cajero' },
      });
      expect(prisma.profile.upsert).toHaveBeenCalledWith({
        where: { id: 'u1' },
        create: { id: 'u1', fullName: 'A', role: 'cajero', branchId: 'b1' },
        update: { fullName: 'A', role: 'cajero', branchId: 'b1' },
      });
      expect(result).toEqual({ id: 'u1' });
    });
  });

  describe('remove', () => {
    it('bloquea el borrado si el usuario tiene ventas registradas', async () => {
      prisma.order.count.mockResolvedValue(2);

      await expect(service.remove('u1')).rejects.toThrow(ConflictException);
      expect(authAdmin.deleteUser).not.toHaveBeenCalled();
    });

    it('borra el profile antes que el usuario de auth (evita violar la FK profiles_id_fkey)', async () => {
      prisma.order.count.mockResolvedValue(0);
      const callOrder: string[] = [];
      prisma.profile.delete.mockImplementation(async () => { callOrder.push('profile'); });
      authAdmin.deleteUser.mockImplementation(async () => { callOrder.push('auth'); });

      await service.remove('u1');

      expect(prisma.profile.delete).toHaveBeenCalledWith({ where: { id: 'u1' } });
      expect(authAdmin.deleteUser).toHaveBeenCalledWith('u1');
      expect(callOrder).toEqual(['profile', 'auth']);
    });
  });
});

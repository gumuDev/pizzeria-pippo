import { Test, TestingModule } from '@nestjs/testing';
import { BranchesService } from './branches.service';
import { BranchHasCashiersException } from '../common/exceptions/branch-has-cashiers.exception';
import { PrismaService } from '../prisma/prisma.service';
import type { CurrentUserPayload } from '../auth/types/jwt.types';

describe('BranchesService', () => {
  let service: BranchesService;
  let prisma: {
    branch: { findMany: jest.Mock; create: jest.Mock; update: jest.Mock };
    profile: { findMany: jest.Mock };
  };

  const admin: CurrentUserPayload = { id: 'u1', role: 'admin', branch_id: null, full_name: 'Admin', business_id: null };
  const cajero: CurrentUserPayload = { id: 'u2', role: 'cajero', branch_id: 'b1', full_name: 'Cajero', business_id: null };

  beforeEach(async () => {
    prisma = {
      branch: { findMany: jest.fn(), create: jest.fn(), update: jest.fn() },
      profile: { findMany: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [BranchesService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(BranchesService);
  });

  describe('list', () => {
    it('un admin ve todas las sucursales (sin filtro por id)', async () => {
      prisma.branch.findMany.mockResolvedValue([]);

      await service.list({}, admin);

      expect(prisma.branch.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { isActive: true } }),
      );
    });

    it('un no-admin solo ve su propia sucursal', async () => {
      prisma.branch.findMany.mockResolvedValue([]);

      await service.list({}, cajero);

      expect(prisma.branch.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { isActive: true, id: 'b1' } }),
      );
    });

    it('incluye inactivas cuando showInactive=true', async () => {
      prisma.branch.findMany.mockResolvedValue([]);

      await service.list({ showInactive: 'true' }, admin);

      expect(prisma.branch.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: {} }));
    });
  });

  describe('setActive / remove', () => {
    it('bloquea la desactivación si hay cajeros asignados', async () => {
      prisma.profile.findMany.mockResolvedValue([{ id: 'c1', fullName: 'Juan' }]);

      await expect(service.setActive('b1', false)).rejects.toThrow(BranchHasCashiersException);
      expect(prisma.branch.update).not.toHaveBeenCalled();
    });

    it('permite la desactivación si no hay cajeros asignados', async () => {
      prisma.profile.findMany.mockResolvedValue([]);

      await service.setActive('b1', false);

      expect(prisma.branch.update).toHaveBeenCalledWith({ where: { id: 'b1' }, data: { isActive: false } });
    });

    it('remove hace soft-delete y respeta el mismo chequeo de cajeros', async () => {
      prisma.profile.findMany.mockResolvedValue([{ id: 'c1', fullName: 'Juan' }]);

      await expect(service.remove('b1')).rejects.toThrow(BranchHasCashiersException);
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { VariantTypesService } from './variant-types.service';
import { VariantTypeInUseException } from '../common/exceptions/variant-type-in-use.exception';
import { PrismaService } from '../prisma/prisma.service';

describe('VariantTypesService', () => {
  let service: VariantTypesService;
  let prisma: {
    variantType: { findMany: jest.Mock; findUnique: jest.Mock; create: jest.Mock; update: jest.Mock };
    productVariant: { count: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      variantType: { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
      productVariant: { count: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [VariantTypesService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(VariantTypesService);
  });

  describe('list', () => {
    it('por defecto solo trae tipos activos, ordenados por created_at', async () => {
      prisma.variantType.findMany.mockResolvedValue([]);

      await service.list({});

      expect(prisma.variantType.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        orderBy: { createdAt: 'asc' },
      });
    });

    it('con onlyActive=false trae también los inactivos', async () => {
      prisma.variantType.findMany.mockResolvedValue([]);

      await service.list({ onlyActive: 'false' });

      expect(prisma.variantType.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { createdAt: 'asc' },
      });
    });
  });

  describe('setActive', () => {
    it('bloquea la desactivación si hay variantes activas usando el tipo', async () => {
      prisma.variantType.findUnique.mockResolvedValue({ id: 't1', name: 'Mediana' });
      prisma.productVariant.count.mockResolvedValue(3);

      await expect(service.setActive('t1', false)).rejects.toThrow(VariantTypeInUseException);
      expect(prisma.variantType.update).not.toHaveBeenCalled();
    });

    it('permite la desactivación si no hay variantes en uso', async () => {
      prisma.variantType.findUnique.mockResolvedValue({ id: 't1', name: 'Mediana' });
      prisma.productVariant.count.mockResolvedValue(0);
      prisma.variantType.update.mockResolvedValue({
        id: 't1',
        name: 'Mediana',
        sortOrder: 0,
        isActive: false,
        createdAt: new Date(),
      });

      await service.setActive('t1', false);

      expect(prisma.variantType.update).toHaveBeenCalledWith({ where: { id: 't1' }, data: { isActive: false } });
    });

    it('lanza NotFoundException si el tipo no existe', async () => {
      prisma.variantType.findUnique.mockResolvedValue(null);

      await expect(service.setActive('missing', false)).rejects.toThrow(NotFoundException);
    });

    it('no chequea uso al reactivar', async () => {
      prisma.variantType.update.mockResolvedValue({
        id: 't1',
        name: 'Mediana',
        sortOrder: 0,
        isActive: true,
        createdAt: new Date(),
      });

      await service.setActive('t1', true);

      expect(prisma.productVariant.count).not.toHaveBeenCalled();
      expect(prisma.variantType.update).toHaveBeenCalledWith({ where: { id: 't1' }, data: { isActive: true } });
    });
  });
});

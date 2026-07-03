import { ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { IngredientsService } from './ingredients.service';
import { PrismaService } from '../prisma/prisma.service';

describe('IngredientsService', () => {
  let service: IngredientsService;
  let prisma: {
    ingredient: { findMany: jest.Mock; count: jest.Mock; create: jest.Mock; update: jest.Mock };
    recipe: { count: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      ingredient: { findMany: jest.fn(), count: jest.fn(), create: jest.fn(), update: jest.fn() },
      recipe: { count: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [IngredientsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(IngredientsService);
  });

  describe('list', () => {
    it('filtra por is_active=true cuando showInactive no viene', async () => {
      prisma.ingredient.findMany.mockResolvedValue([]);
      prisma.ingredient.count.mockResolvedValue(0);

      await service.list({});

      expect(prisma.ingredient.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { isActive: true } }),
      );
    });

    it('incluye inactivos cuando showInactive=true', async () => {
      prisma.ingredient.findMany.mockResolvedValue([]);
      prisma.ingredient.count.mockResolvedValue(0);

      await service.list({ showInactive: 'true' });

      expect(prisma.ingredient.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: {} }));
    });

    it('mapea las filas al shape de @pippo/shared con fechas como string', async () => {
      prisma.ingredient.findMany.mockResolvedValue([
        { id: '1', name: 'Harina', unit: 'kg', isActive: true, createdAt: new Date('2026-01-01T00:00:00.000Z') },
      ]);
      prisma.ingredient.count.mockResolvedValue(1);

      const result = await service.list({});

      expect(result.data).toEqual([
        { id: '1', name: 'Harina', unit: 'kg', created_at: '2026-01-01T00:00:00.000Z', is_active: true },
      ]);
      expect(result.total).toBe(1);
    });
  });

  describe('update', () => {
    it('bloquea la desactivación si el insumo está en recetas activas', async () => {
      prisma.recipe.count.mockResolvedValue(2);

      await expect(service.update('1', { is_active: false })).rejects.toThrow(ConflictException);
      expect(prisma.ingredient.update).not.toHaveBeenCalled();
    });

    it('permite la desactivación si no hay recetas activas', async () => {
      prisma.recipe.count.mockResolvedValue(0);

      await service.update('1', { is_active: false });

      expect(prisma.ingredient.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { isActive: false },
      });
    });

    it('no chequea recetas si no se está desactivando', async () => {
      await service.update('1', { name: 'Harina 000' });

      expect(prisma.recipe.count).not.toHaveBeenCalled();
      expect(prisma.ingredient.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { name: 'Harina 000' },
      });
    });
  });

  describe('softDelete', () => {
    it('bloquea el borrado si el insumo está en recetas activas', async () => {
      prisma.recipe.count.mockResolvedValue(1);

      await expect(service.softDelete('1')).rejects.toThrow(ConflictException);
      expect(prisma.ingredient.update).not.toHaveBeenCalled();
    });

    it('marca is_active=false si no hay recetas activas', async () => {
      prisma.recipe.count.mockResolvedValue(0);

      await service.softDelete('1');

      expect(prisma.ingredient.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { isActive: false },
      });
    });
  });
});

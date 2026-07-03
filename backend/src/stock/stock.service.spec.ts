import { Test, TestingModule } from '@nestjs/testing';
import { StockService } from './stock.service';
import { PrismaService } from '../prisma/prisma.service';

function decimal(value: number) {
  return { toNumber: () => value };
}

describe('StockService', () => {
  let service: StockService;
  let prisma: {
    branchStock: { findMany: jest.Mock; count: jest.Mock; findFirst: jest.Mock; update: jest.Mock; create: jest.Mock };
    stockMovement: { findMany: jest.Mock; count: jest.Mock; create: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      branchStock: { findMany: jest.fn(), count: jest.fn(), findFirst: jest.fn(), update: jest.fn(), create: jest.fn() },
      stockMovement: { findMany: jest.fn(), count: jest.fn(), create: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [StockService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(StockService);
  });

  describe('list', () => {
    it('filtra por branchId cuando viene en la query', async () => {
      prisma.branchStock.findMany.mockResolvedValue([]);
      prisma.branchStock.count.mockResolvedValue(0);

      await service.list({ branchId: 'b1' });

      expect(prisma.branchStock.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { branchId: 'b1' } }),
      );
    });

    it('mapea filas con ingredient/branch denormalizados y Decimal a number', async () => {
      prisma.branchStock.findMany.mockResolvedValue([
        {
          id: 's1',
          branchId: 'b1',
          ingredientId: 'i1',
          quantity: decimal(5),
          minQuantity: decimal(2),
          ingredient: { id: 'i1', name: 'Harina', unit: 'kg' },
          branch: { id: 'b1', name: 'Centro' },
        },
      ]);
      prisma.branchStock.count.mockResolvedValue(1);

      const result = await service.list({});

      expect(result.data[0]).toEqual({
        id: 's1',
        branch_id: 'b1',
        ingredient_id: 'i1',
        quantity: 5,
        min_quantity: 2,
        ingredients: { id: 'i1', name: 'Harina', unit: 'kg' },
        branches: { id: 'b1', name: 'Centro' },
      });
    });
  });

  describe('getAlerts', () => {
    it('filtra solo las filas con quantity < min_quantity', async () => {
      prisma.branchStock.findMany.mockResolvedValue([
        { id: 's1', branchId: 'b1', ingredientId: 'i1', quantity: decimal(1), minQuantity: decimal(5), ingredient: { id: 'i1', name: 'Harina', unit: 'kg' }, branch: { id: 'b1', name: 'Centro' } },
        { id: 's2', branchId: 'b1', ingredientId: 'i2', quantity: decimal(10), minQuantity: decimal(5), ingredient: { id: 'i2', name: 'Queso', unit: 'kg' }, branch: { id: 'b1', name: 'Centro' } },
      ]);

      const result = await service.getAlerts({});

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('s1');
    });
  });

  describe('purchase', () => {
    it('suma la cantidad al stock existente y registra el movimiento tipo compra', async () => {
      prisma.branchStock.findFirst.mockResolvedValue({ id: 's1', quantity: decimal(5) });

      await service.purchase({ branch_id: 'b1', ingredient_id: 'i1', quantity: 3 }, 'u1');

      expect(prisma.branchStock.update).toHaveBeenCalledWith({ where: { id: 's1' }, data: { quantity: 8 } });
      expect(prisma.stockMovement.create).toHaveBeenCalledWith({
        data: { branchId: 'b1', ingredientId: 'i1', quantity: 3, type: 'compra', createdBy: 'u1' },
      });
    });

    it('crea el registro de stock si no existía', async () => {
      prisma.branchStock.findFirst.mockResolvedValue(null);

      await service.purchase({ branch_id: 'b1', ingredient_id: 'i1', quantity: 3, min_quantity: 1 }, 'u1');

      expect(prisma.branchStock.create).toHaveBeenCalledWith({
        data: { branchId: 'b1', ingredientId: 'i1', quantity: 3, minQuantity: 1 },
      });
    });
  });

  describe('adjust', () => {
    it('calcula la diferencia contra la cantidad existente y la registra como ajuste', async () => {
      prisma.branchStock.findFirst.mockResolvedValue({ id: 's1', quantity: decimal(10) });

      const result = await service.adjust({ branch_id: 'b1', ingredient_id: 'i1', real_quantity: 7 }, 'u1');

      expect(prisma.branchStock.update).toHaveBeenCalledWith({ where: { id: 's1' }, data: { quantity: 7 } });
      expect(prisma.stockMovement.create).toHaveBeenCalledWith({
        data: { branchId: 'b1', ingredientId: 'i1', quantity: -3, type: 'ajuste', notes: null, createdBy: 'u1' },
      });
      expect(result).toEqual({ difference: -3 });
    });

    it('trata el stock inexistente como cantidad 0 para calcular la diferencia', async () => {
      prisma.branchStock.findFirst.mockResolvedValue(null);

      const result = await service.adjust({ branch_id: 'b1', ingredient_id: 'i1', real_quantity: 5, notes: 'conteo físico' }, 'u1');

      expect(prisma.branchStock.create).toHaveBeenCalledWith({
        data: { branchId: 'b1', ingredientId: 'i1', quantity: 5, minQuantity: 0 },
      });
      expect(result).toEqual({ difference: 5 });
    });
  });

  describe('updateMinQuantity', () => {
    it('actualiza min_quantity por id', async () => {
      await service.updateMinQuantity('s1', 4);

      expect(prisma.branchStock.update).toHaveBeenCalledWith({ where: { id: 's1' }, data: { minQuantity: 4 } });
    });
  });
});

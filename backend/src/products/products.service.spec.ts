import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { PrismaService } from '../prisma/prisma.service';

function decimal(value: number) {
  return { toNumber: () => value };
}

describe('ProductsService', () => {
  let service: ProductsService;
  let prisma: {
    product: { findMany: jest.Mock; count: jest.Mock; findUnique: jest.Mock; create: jest.Mock; update: jest.Mock };
    productVariant: { findMany: jest.Mock; create: jest.Mock; update: jest.Mock; updateMany: jest.Mock };
    branchPrice: { createMany: jest.Mock; deleteMany: jest.Mock; findFirst: jest.Mock; create: jest.Mock; update: jest.Mock };
    recipe: { createMany: jest.Mock; deleteMany: jest.Mock };
    branchProductStock: { findMany: jest.Mock };
    branch: { findMany: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      product: { findMany: jest.fn(), count: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
      productVariant: { findMany: jest.fn(), create: jest.fn(), update: jest.fn(), updateMany: jest.fn() },
      branchPrice: { createMany: jest.fn(), deleteMany: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn() },
      recipe: { createMany: jest.fn(), deleteMany: jest.fn() },
      branchProductStock: { findMany: jest.fn() },
      branch: { findMany: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [ProductsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(ProductsService);
  });

  describe('list', () => {
    it('filtra por is_active=true cuando showInactive no viene', async () => {
      prisma.product.findMany.mockResolvedValue([]);
      prisma.product.count.mockResolvedValue(0);

      await service.list({});

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { isActive: true } }),
      );
    });

    it('mapea productos y variantes al shape de @pippo/shared, con Decimal a number', async () => {
      prisma.product.findMany.mockResolvedValue([
        {
          id: 'p1',
          name: 'Muzzarella',
          category: 'pizza',
          description: null,
          imageUrl: null,
          productType: 'made',
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
          isActive: true,
          variants: [
            {
              id: 'v1',
              productId: 'p1',
              name: 'Chica',
              basePrice: decimal(20),
              createdAt: new Date('2026-01-01T00:00:00.000Z'),
              isActive: true,
            },
          ],
        },
      ]);
      prisma.product.count.mockResolvedValue(1);

      const result = await service.list({});

      expect(result.data[0].product_variants?.[0].base_price).toBe(20);
      expect(result.data[0].created_at).toBe('2026-01-01T00:00:00.000Z');
      expect(result.total).toBe(1);
    });
  });

  describe('getDetail', () => {
    it('devuelve null si no existe', async () => {
      prisma.product.findUnique.mockResolvedValue(null);

      const result = await service.getDetail('missing');

      expect(result).toBeNull();
    });

    it('mapea el shape rico con nombre de sucursal e insumo denormalizados', async () => {
      prisma.product.findUnique.mockResolvedValue({
        id: 'p1',
        name: 'Muzzarella',
        category: 'pizza',
        description: null,
        imageUrl: null,
        productType: 'made',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        isActive: true,
        variants: [
          {
            id: 'v1',
            productId: 'p1',
            name: 'Chica',
            basePrice: decimal(20),
            createdAt: new Date('2026-01-01T00:00:00.000Z'),
            isActive: true,
            branchPrices: [{ branchId: 'b1', variantId: 'v1', price: decimal(22), branch: { name: 'Centro' } }],
            recipes: [{ ingredientId: 'i1', quantity: decimal(1), applyCondition: 'always', ingredient: { name: 'Harina', unit: 'kg' } }],
          },
        ],
      });

      const result = await service.getDetail('p1');

      expect(result?.product_variants[0].branch_prices[0]).toEqual({
        branch_id: 'b1',
        variant_id: 'v1',
        price: 22,
        branches: { name: 'Centro' },
      });
      expect(result?.product_variants[0].recipes[0]).toEqual({
        ingredient_id: 'i1',
        quantity: 1,
        apply_condition: 'always',
        ingredients: { name: 'Harina', unit: 'kg' },
      });
    });
  });

  describe('create', () => {
    it('crea el producto y sus variantes con branch_prices y recipes', async () => {
      prisma.product.create.mockResolvedValue({ id: 'p1' });
      prisma.productVariant.create.mockResolvedValue({ id: 'v1' });

      await service.create({
        name: 'Muzzarella',
        category: 'pizza',
        variants: [
          {
            name: 'Chica',
            base_price: 20,
            branch_prices: [{ branch_id: 'b1', price: 22 }],
            recipes: [{ ingredient_id: 'i1', quantity: 1 }],
          },
        ],
      } as never);

      expect(prisma.productVariant.create).toHaveBeenCalledWith({
        data: { productId: 'p1', name: 'Chica', basePrice: 20 },
      });
      expect(prisma.branchPrice.createMany).toHaveBeenCalledWith({
        data: [{ branchId: 'b1', variantId: 'v1', price: 22 }],
      });
      expect(prisma.recipe.createMany).toHaveBeenCalledWith({
        data: [{ variantId: 'v1', ingredientId: 'i1', quantity: 1, applyCondition: 'always' }],
      });
    });
  });

  describe('update', () => {
    it('desactiva variantes que ya no vienen en el payload', async () => {
      prisma.productVariant.findMany.mockResolvedValue([{ id: 'v1', name: 'Chica' }, { id: 'v2', name: 'Grande' }]);

      await service.update('p1', {
        name: 'Muzzarella',
        category: 'pizza',
        variants: [{ name: 'Chica', base_price: 20, branch_prices: [], recipes: [] }],
      } as never);

      expect(prisma.productVariant.update).toHaveBeenCalledWith({ where: { id: 'v2' }, data: { isActive: false } });
    });

    it('reactiva y actualiza precio de una variante existente', async () => {
      prisma.productVariant.findMany.mockResolvedValue([{ id: 'v1', name: 'Chica' }]);

      await service.update('p1', {
        name: 'Muzzarella',
        category: 'pizza',
        variants: [{ name: 'Chica', base_price: 25, branch_prices: [], recipes: [] }],
      } as never);

      expect(prisma.productVariant.update).toHaveBeenCalledWith({
        where: { id: 'v1' },
        data: { basePrice: 25, isActive: true },
      });
    });

    it('crea una variante nueva si no existe por nombre', async () => {
      prisma.productVariant.findMany.mockResolvedValue([]);
      prisma.productVariant.create.mockResolvedValue({ id: 'v-new' });

      await service.update('p1', {
        name: 'Muzzarella',
        category: 'pizza',
        variants: [{ name: 'Familiar', base_price: 30, branch_prices: [], recipes: [] }],
      } as never);

      expect(prisma.productVariant.create).toHaveBeenCalledWith({
        data: { productId: 'p1', name: 'Familiar', basePrice: 30 },
      });
    });

    it('borra y recrea branch_prices y recipes de cada variante (config reemplazable)', async () => {
      prisma.productVariant.findMany.mockResolvedValue([{ id: 'v1', name: 'Chica' }]);

      await service.update('p1', {
        name: 'Muzzarella',
        category: 'pizza',
        variants: [{ name: 'Chica', base_price: 20, branch_prices: [{ branch_id: 'b1', price: 22 }], recipes: [] }],
      } as never);

      expect(prisma.branchPrice.deleteMany).toHaveBeenCalledWith({ where: { variantId: 'v1' } });
      expect(prisma.branchPrice.createMany).toHaveBeenCalledWith({
        data: [{ branchId: 'b1', variantId: 'v1', price: 22 }],
      });
    });
  });

  describe('setActive / softDelete', () => {
    it('cascada is_active a las variantes del producto', async () => {
      await service.setActive('p1', false);

      expect(prisma.productVariant.updateMany).toHaveBeenCalledWith({ where: { productId: 'p1' }, data: { isActive: false } });
      expect(prisma.product.update).toHaveBeenCalledWith({ where: { id: 'p1' }, data: { isActive: false } });
    });

    it('softDelete desactiva producto y variantes', async () => {
      await service.softDelete('p1');

      expect(prisma.productVariant.updateMany).toHaveBeenCalledWith({ where: { productId: 'p1' }, data: { isActive: false } });
      expect(prisma.product.update).toHaveBeenCalledWith({ where: { id: 'p1' }, data: { isActive: false } });
    });
  });

  describe('listAllVariants', () => {
    it('mapea id/name/product_name de todas las variantes', async () => {
      prisma.productVariant.findMany.mockResolvedValue([
        { id: 'v1', name: 'Familiar', product: { name: 'Hawaiana' } },
        { id: 'v2', name: 'Mediana', product: null },
      ]);

      const result = await service.listAllVariants();

      expect(prisma.productVariant.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { name: 'asc' } }),
      );
      expect(result).toEqual([
        { id: 'v1', name: 'Familiar', product_name: 'Hawaiana' },
        { id: 'v2', name: 'Mediana', product_name: '' },
      ]);
    });
  });

  describe('getBranchPrices', () => {
    it('devuelve variantes activas con sus precios por sucursal y la lista de sucursales', async () => {
      prisma.productVariant.findMany.mockResolvedValue([
        {
          id: 'v1',
          name: 'Familiar',
          basePrice: decimal(50),
          branchPrices: [{ id: 'bp1', branchId: 'b1', price: decimal(55), branch: { id: 'b1', name: 'Centro' } }],
        },
      ]);
      prisma.branch.findMany.mockResolvedValue([{ id: 'b1', name: 'Centro' }]);

      const result = await service.getBranchPrices('p1');

      expect(prisma.productVariant.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { productId: 'p1', isActive: true } }),
      );
      expect(result).toEqual({
        variants: [
          {
            id: 'v1',
            name: 'Familiar',
            base_price: 50,
            branch_prices: [{ id: 'bp1', branch_id: 'b1', price: 55, branches: { id: 'b1', name: 'Centro' } }],
          },
        ],
        branches: [{ id: 'b1', name: 'Centro' }],
      });
    });
  });

  describe('upsertBranchPrice', () => {
    it('actualiza el precio si ya existe la combinación variante/sucursal', async () => {
      prisma.branchPrice.findFirst.mockResolvedValue({ id: 'bp1' });

      await service.upsertBranchPrice({ variant_id: 'v1', branch_id: 'b1', price: 60 });

      expect(prisma.branchPrice.update).toHaveBeenCalledWith({ where: { id: 'bp1' }, data: { price: 60 } });
      expect(prisma.branchPrice.create).not.toHaveBeenCalled();
    });

    it('crea el precio si no existe la combinación', async () => {
      prisma.branchPrice.findFirst.mockResolvedValue(null);

      await service.upsertBranchPrice({ variant_id: 'v1', branch_id: 'b1', price: 60 });

      expect(prisma.branchPrice.create).toHaveBeenCalledWith({
        data: { variantId: 'v1', branchId: 'b1', price: 60 },
      });
    });
  });

  describe('getVariantsWithDetails', () => {
    it('mapea variantes con branch_prices y recipes, Decimal a number', async () => {
      prisma.productVariant.findMany.mockResolvedValue([
        {
          id: 'v1',
          productId: 'p1',
          name: 'Chica',
          basePrice: decimal(20),
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
          isActive: true,
          branchPrices: [{ branchId: 'b1', variantId: 'v1', price: decimal(22) }],
          recipes: [{ ingredientId: 'i1', quantity: decimal(1), applyCondition: 'always' }],
        },
      ]);

      const result = await service.getVariantsWithDetails('p1');

      expect(result).toEqual([
        {
          id: 'v1',
          product_id: 'p1',
          name: 'Chica',
          base_price: 20,
          created_at: '2026-01-01T00:00:00.000Z',
          is_active: true,
          branch_prices: [{ branch_id: 'b1', variant_id: 'v1', price: 22 }],
          recipes: [{ ingredient_id: 'i1', quantity: 1, apply_condition: 'always' }],
        },
      ]);
    });
  });

  describe('getPosCatalog', () => {
    it('filtra variantes "made" sin branch_price para esta sucursal, y descarta el producto si queda sin variantes', async () => {
      prisma.product.findMany.mockResolvedValue([
        {
          id: 'p1',
          name: 'Pizza',
          category: 'pizza',
          description: null,
          imageUrl: null,
          isActive: true,
          productType: 'made',
          variants: [
            {
              id: 'v1',
              name: 'Chica',
              basePrice: decimal(20),
              isActive: true,
              branchPrices: [{ branchId: 'b1', price: decimal(22) }],
              recipes: [],
            },
            {
              id: 'v2',
              name: 'Grande',
              basePrice: decimal(30),
              isActive: true,
              branchPrices: [{ branchId: 'other-branch', price: decimal(35) }],
              recipes: [],
            },
          ],
        },
        {
          id: 'p2',
          name: 'Sin precio en b1',
          category: 'pizza',
          description: null,
          imageUrl: null,
          isActive: true,
          productType: 'made',
          variants: [
            {
              id: 'v3',
              name: 'Chica',
              basePrice: decimal(20),
              isActive: true,
              branchPrices: [{ branchId: 'other-branch', price: decimal(20) }],
              recipes: [],
            },
          ],
        },
      ]);

      const result = await service.getPosCatalog('b1');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('p1');
      expect(result[0].product_variants).toHaveLength(1);
      expect(result[0].product_variants[0].id).toBe('v1');
    });

    it('a los productos de reventa no les exige branch_price, y les agrega stock_quantity', async () => {
      prisma.product.findMany.mockResolvedValue([
        {
          id: 'p3',
          name: 'Gaseosa',
          category: 'bebida',
          description: null,
          imageUrl: null,
          isActive: true,
          productType: 'resale',
          variants: [
            { id: 'v4', name: 'Unidad', basePrice: decimal(10), isActive: true, branchPrices: [], recipes: [] },
          ],
        },
      ]);
      prisma.branchProductStock.findMany.mockResolvedValue([
        { variantId: 'v4', quantity: decimal(15) },
      ]);

      const result = await service.getPosCatalog('b1');

      expect(prisma.branchProductStock.findMany).toHaveBeenCalledWith({
        where: { branchId: 'b1', variantId: { in: ['v4'] } },
      });
      expect(result[0].product_variants[0].stock_quantity).toBe(15);
    });

    it('stock_quantity queda null si no hay fila de stock para esa variante', async () => {
      prisma.product.findMany.mockResolvedValue([
        {
          id: 'p4',
          name: 'Agua',
          category: 'bebida',
          description: null,
          imageUrl: null,
          isActive: true,
          productType: 'resale',
          variants: [
            { id: 'v5', name: 'Unidad', basePrice: decimal(5), isActive: true, branchPrices: [], recipes: [] },
          ],
        },
      ]);
      prisma.branchProductStock.findMany.mockResolvedValue([]);

      const result = await service.getPosCatalog('b1');

      expect(result[0].product_variants[0].stock_quantity).toBeNull();
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { PrismaService } from '../prisma/prisma.service';
import { PromotionsService } from '../promotions/promotions.service';
import { LowStockAlertService } from '../notifications/low-stock-alert.service';
import type { CurrentUserPayload } from '../auth/types/jwt.types';
import type { CreateOrderDto } from './dto/create-order.dto';

function decimal(value: number) {
  return { toNumber: () => value };
}

describe('OrdersService', () => {
  let service: OrdersService;
  let prisma: { productVariant: { findMany: jest.Mock }; $queryRaw: jest.Mock; order: { findMany: jest.Mock } };
  let promotionsService: { list: jest.Mock };
  let lowStockAlertService: { checkAndNotify: jest.Mock };

  const cashier: CurrentUserPayload = {
    id: 'u1',
    role: 'cajero',
    branch_id: 'b1',
    full_name: 'Cajero',
    business_id: 'biz1',
  };

  const madeVariant = {
    id: 'v-pizza',
    name: 'Familiar',
    basePrice: decimal(70),
    isActive: true,
    branchPrices: [{ branchId: 'b1', price: decimal(75) }],
    recipes: [{ ingredientId: 'i-masa', quantity: decimal(1), applyCondition: 'always' }],
    product: { name: 'Hawaiana', category: 'pizza', productType: 'made', isActive: true },
  };

  const resaleVariant = {
    id: 'v-coca',
    name: 'Unidad',
    basePrice: decimal(10),
    isActive: true,
    branchPrices: [],
    recipes: [],
    product: { name: 'Coca-Cola', category: 'bebida', productType: 'resale', isActive: true },
  };

  function baseDto(overrides: Partial<CreateOrderDto> = {}): CreateOrderDto {
    return {
      branch_id: 'b1',
      total: 75,
      payment_method: 'efectivo',
      order_type: 'dine_in',
      idempotency_key: null,
      items: [{ variant_id: 'v-pizza', qty: 1 }],
      ...overrides,
    } as CreateOrderDto;
  }

  beforeEach(async () => {
    prisma = {
      productVariant: { findMany: jest.fn() },
      $queryRaw: jest.fn(),
      order: { findMany: jest.fn() },
    };
    promotionsService = { list: jest.fn().mockResolvedValue([]) };
    lowStockAlertService = { checkAndNotify: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: PrismaService, useValue: prisma },
        { provide: PromotionsService, useValue: promotionsService },
        { provide: LowStockAlertService, useValue: lowStockAlertService },
      ],
    }).compile();

    service = module.get(OrdersService);
  });

  it('resuelve el precio server-side por sucursal y llama a create_order_atomic', async () => {
    prisma.productVariant.findMany.mockResolvedValue([madeVariant]);
    prisma.$queryRaw.mockResolvedValue([{ create_order_atomic: { order_id: 'o1', daily_number: 3, duplicate: false } }]);

    const result = await service.create(baseDto({ total: 75 }), cashier);

    expect(result).toEqual({ order_id: 'o1', daily_number: 3, duplicate: false });
    expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
  });

  it('rechaza si la variante no tiene precio para la sucursal y el producto no es de reventa', async () => {
    const variantSinPrecio = { ...madeVariant, branchPrices: [] };
    prisma.productVariant.findMany.mockResolvedValue([variantSinPrecio]);

    await expect(service.create(baseDto(), cashier)).rejects.toThrow(BadRequestException);
    expect(prisma.$queryRaw).not.toHaveBeenCalled();
  });

  it('no exige branch_price para productos de reventa', async () => {
    prisma.productVariant.findMany.mockResolvedValue([resaleVariant]);
    prisma.$queryRaw.mockResolvedValue([{ create_order_atomic: { order_id: 'o2', daily_number: 1, duplicate: false } }]);

    const dto = baseDto({ total: 10, items: [{ variant_id: 'v-coca', qty: 1 }] });

    await expect(service.create(dto, cashier)).resolves.toEqual({ order_id: 'o2', daily_number: 1, duplicate: false });
  });

  it('rechaza si el producto o la variante están inactivos', async () => {
    prisma.productVariant.findMany.mockResolvedValue([{ ...madeVariant, isActive: false }]);

    await expect(service.create(baseDto(), cashier)).rejects.toThrow(BadRequestException);
  });

  it('rechaza con 409 si el total del cliente no coincide con el calculado en el servidor', async () => {
    prisma.productVariant.findMany.mockResolvedValue([madeVariant]);

    await expect(service.create(baseDto({ total: 999 }), cashier)).rejects.toThrow(ConflictException);
    expect(prisma.$queryRaw).not.toHaveBeenCalled();
  });

  it('dispara la alerta de stock bajo (fire-and-forget) cuando hay deducciones de ingredientes', async () => {
    prisma.productVariant.findMany.mockResolvedValue([madeVariant]);
    prisma.$queryRaw.mockResolvedValue([{ create_order_atomic: { order_id: 'o1', daily_number: 1, duplicate: false } }]);

    await service.create(baseDto({ total: 75 }), cashier);

    expect(lowStockAlertService.checkAndNotify).toHaveBeenCalledWith('biz1', 'b1', ['i-masa'], []);
  });

  it('no dispara la alerta de stock si el usuario no tiene business_id', async () => {
    prisma.productVariant.findMany.mockResolvedValue([madeVariant]);
    prisma.$queryRaw.mockResolvedValue([{ create_order_atomic: { order_id: 'o1', daily_number: 1, duplicate: false } }]);

    const sinNegocio: CurrentUserPayload = { ...cashier, business_id: null };
    await service.create(baseDto({ total: 75 }), sinNegocio);

    expect(lowStockAlertService.checkAndNotify).not.toHaveBeenCalled();
  });

  it('dispara la alerta de stock con deducciones de reventa cuando la venta es solo de reventa', async () => {
    prisma.productVariant.findMany.mockResolvedValue([resaleVariant]);
    prisma.$queryRaw.mockResolvedValue([{ create_order_atomic: { order_id: 'o2', daily_number: 1, duplicate: false } }]);

    await service.create(baseDto({ total: 10, items: [{ variant_id: 'v-coca', qty: 1 }] }), cashier);

    expect(lowStockAlertService.checkAndNotify).toHaveBeenCalledWith('biz1', 'b1', [], ['v-coca']);
  });

  it('no dispara la alerta si no hubo deducciones de ningún tipo', async () => {
    const variantSinReceta = { ...madeVariant, recipes: [] };
    prisma.productVariant.findMany.mockResolvedValue([variantSinReceta]);
    prisma.$queryRaw.mockResolvedValue([{ create_order_atomic: { order_id: 'o3', daily_number: 1, duplicate: false } }]);

    await service.create(baseDto({ total: 75 }), cashier);

    expect(lowStockAlertService.checkAndNotify).not.toHaveBeenCalled();
  });

  describe('getDayOrders', () => {
    it('mapea las órdenes del día con sus items, sin excluir canceladas', async () => {
      prisma.order.findMany.mockResolvedValue([
        {
          id: 'o1',
          dailyNumber: 5,
          createdAt: new Date('2026-07-05T18:00:00Z'),
          total: decimal(75),
          kitchenStatus: 'ready',
          paymentMethod: 'efectivo',
          orderType: 'dine_in',
          cancelledAt: null,
          items: [{ qty: 1, variant: { name: 'Familiar', product: { name: 'Hawaiana' } } }],
        },
        {
          id: 'o2',
          dailyNumber: 4,
          createdAt: new Date('2026-07-05T17:00:00Z'),
          total: decimal(10),
          kitchenStatus: 'pending',
          paymentMethod: 'qr',
          orderType: 'takeaway',
          cancelledAt: new Date('2026-07-05T17:05:00Z'),
          items: [],
        },
      ]);

      const result = await service.getDayOrders('b1', '2026-07-05');

      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ branchId: 'b1' }) }),
      );
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'o1',
        daily_number: 5,
        created_at: '2026-07-05T18:00:00.000Z',
        total: 75,
        kitchen_status: 'ready',
        payment_method: 'efectivo',
        order_type: 'dine_in',
        cancelled_at: null,
        order_items: [{ qty: 1, product_variants: { name: 'Familiar', products: { name: 'Hawaiana' } } }],
      });
      expect(result[1].cancelled_at).toBe('2026-07-05T17:05:00.000Z');
    });

    it('usa el día de hoy en Bolivia cuando no se especifica fecha', async () => {
      prisma.order.findMany.mockResolvedValue([]);

      await service.getDayOrders('b1');

      expect(prisma.order.findMany).toHaveBeenCalled();
    });
  });
});

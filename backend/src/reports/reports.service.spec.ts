import { Test, TestingModule } from '@nestjs/testing';
import { ReportsService } from './reports.service';
import { PrismaService } from '../prisma/prisma.service';

const decimal = (value: number) => ({ toNumber: () => value }) as never;

describe('ReportsService', () => {
  let service: ReportsService;
  let prisma: {
    order: { findMany: jest.Mock; count: jest.Mock };
    orderItem: { findMany: jest.Mock };
    $transaction: jest.Mock;
  };

  beforeEach(async () => {
    prisma = {
      order: { findMany: jest.fn(), count: jest.fn() },
      orderItem: { findMany: jest.fn() },
      $transaction: jest.fn((ops: Promise<unknown>[]) => Promise.all(ops)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [ReportsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(ReportsService);
  });

  describe('getSales', () => {
    it('sums totals and splits by order type', async () => {
      prisma.order.findMany.mockResolvedValue([
        { total: decimal(100), orderType: 'dine_in' },
        { total: decimal(50), orderType: 'takeaway' },
        { total: decimal(25), orderType: 'takeaway' },
      ]);

      const result = await service.getSales({});

      expect(result.total).toBe(175);
      expect(result.count).toBe(3);
      expect(result.avg).toBeCloseTo(58.33, 1);
      expect(result.by_order_type.dine_in).toEqual({ total: 100, count: 1 });
      expect(result.by_order_type.takeaway).toEqual({ total: 75, count: 2 });
    });

    it('returns zeroed summary when there are no orders', async () => {
      prisma.order.findMany.mockResolvedValue([]);

      const result = await service.getSales({});

      expect(result).toEqual({
        total: 0,
        count: 0,
        avg: 0,
        by_order_type: {
          dine_in: { total: 0, count: 0 },
          takeaway: { total: 0, count: 0 },
        },
      });
    });
  });

  describe('getDaily', () => {
    it('groups totals by Bolivia-local date', async () => {
      prisma.order.findMany.mockResolvedValue([
        { total: decimal(100), createdAt: new Date('2026-07-01T12:00:00.000Z') },
        { total: decimal(50), createdAt: new Date('2026-07-01T23:30:00.000Z') },
      ]);

      const result = await service.getDaily({});

      expect(result).toEqual([{ date: '2026-07-01', total: 150 }]);
    });
  });

  describe('getTopProducts', () => {
    it('aggregates qty and revenue per variant', async () => {
      const variant = { id: 'v1', name: 'Familiar', product: { name: 'Napolitana', category: 'pizza' } };
      prisma.orderItem.findMany.mockResolvedValue([
        { qty: 2, unitPrice: decimal(50), discountApplied: decimal(0), variant },
        { qty: 1, unitPrice: decimal(50), discountApplied: decimal(10), variant },
      ]);

      const result = await service.getTopProducts({});

      expect(result).toEqual([
        { variant_id: 'v1', product_name: 'Napolitana', variant_name: 'Familiar', category: 'pizza', qty: 3, revenue: 140 },
      ]);
    });
  });

  describe('getCashiers', () => {
    it('groups orders and items by cashier', async () => {
      const variant = { id: 'v1', name: 'Familiar', product: { name: 'Napolitana', category: 'pizza' } };
      prisma.order.findMany.mockResolvedValue([
        {
          cashierId: 'c1',
          cashier: { fullName: 'Ana' },
          total: decimal(100),
          items: [{ qty: 2, unitPrice: decimal(50), discountApplied: decimal(0), variant }],
        },
      ]);

      const result = await service.getCashiers({});

      expect(result).toEqual([
        {
          cashier_id: 'c1',
          cashier_name: 'Ana',
          orders: 1,
          total: 100,
          items: [{ variant_id: 'v1', product_name: 'Napolitana', variant_name: 'Familiar', category: 'pizza', qty: 2, revenue: 100 }],
        },
      ]);
    });
  });

  describe('getOrders', () => {
    it('pagina el historial de órdenes y mapea el shape esperado por el frontend, incluyendo canceladas', async () => {
      prisma.order.findMany.mockResolvedValue([
        {
          id: 'o1',
          dailyNumber: 5,
          total: decimal(70),
          createdAt: new Date('2026-07-01T12:00:00.000Z'),
          branchId: 'b1',
          paymentMethod: 'efectivo',
          orderType: 'dine_in',
          cancelledAt: new Date('2026-07-01T12:05:00.000Z'),
          cancelReason: 'cliente se arrepintió',
          branch: { name: 'Centro' },
          cashier: { fullName: 'Ana' },
          items: [
            {
              qty: 1,
              unitPrice: decimal(70),
              discountApplied: decimal(0),
              promoLabel: null,
              variant: { name: 'Familiar', product: { name: 'Napolitana', category: 'pizza' } },
            },
          ],
        },
      ]);
      prisma.order.count.mockResolvedValue(1);

      const result = await service.getOrders({ page: 1, pageSize: 20 });

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(result.total).toBe(1);
      expect(result.data).toEqual([
        {
          id: 'o1',
          daily_number: 5,
          total: 70,
          created_at: '2026-07-01T12:00:00.000Z',
          branch_id: 'b1',
          cashier_name: 'Ana',
          payment_method: 'efectivo',
          order_type: 'dine_in',
          cancelled_at: '2026-07-01T12:05:00.000Z',
          cancel_reason: 'cliente se arrepintió',
          branches: { name: 'Centro' },
          order_items: [
            {
              qty: 1,
              unit_price: 70,
              discount_applied: 0,
              promo_label: null,
              product_variants: { name: 'Familiar', products: { name: 'Napolitana', category: 'pizza' } },
            },
          ],
        },
      ]);
    });

    it('usa "—" cuando no hay cajero asociado', async () => {
      prisma.order.findMany.mockResolvedValue([
        {
          id: 'o2',
          dailyNumber: 1,
          total: decimal(10),
          createdAt: new Date('2026-07-01T12:00:00.000Z'),
          branchId: 'b1',
          paymentMethod: null,
          orderType: 'takeaway',
          cancelledAt: null,
          cancelReason: null,
          branch: null,
          cashier: null,
          items: [],
        },
      ]);
      prisma.order.count.mockResolvedValue(1);

      const result = await service.getOrders({});

      expect(result.data[0].cashier_name).toBe('—');
      expect(result.data[0].branches).toBeNull();
    });
  });
});

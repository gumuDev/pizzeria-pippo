import { Test, TestingModule } from '@nestjs/testing';
import { ReportsService } from './reports.service';
import { PrismaService } from '../prisma/prisma.service';

const decimal = (value: number) => ({ toNumber: () => value }) as never;

describe('ReportsService', () => {
  let service: ReportsService;
  let prisma: {
    order: { findMany: jest.Mock };
    orderItem: { findMany: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      order: { findMany: jest.fn() },
      orderItem: { findMany: jest.fn() },
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
});

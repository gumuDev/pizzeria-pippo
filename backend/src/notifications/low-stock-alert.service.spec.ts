import { Test, TestingModule } from '@nestjs/testing';
import { LowStockAlertService } from './low-stock-alert.service';
import { NOTIFICATION_PORT } from './notification.port';
import { PrismaService } from '../prisma/prisma.service';

function decimal(value: number) {
  return { toNumber: () => value };
}

describe('LowStockAlertService', () => {
  let service: LowStockAlertService;
  let prisma: { branchStock: { findMany: jest.Mock }; branchProductStock: { findMany: jest.Mock } };
  let notificationPort: { send: jest.Mock };

  beforeEach(async () => {
    prisma = { branchStock: { findMany: jest.fn() }, branchProductStock: { findMany: jest.fn().mockResolvedValue([]) } };
    notificationPort = { send: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LowStockAlertService,
        { provide: PrismaService, useValue: prisma },
        { provide: NOTIFICATION_PORT, useValue: notificationPort },
      ],
    }).compile();

    service = module.get(LowStockAlertService);
  });

  it('does nothing when there are no ingredient ids to check', async () => {
    await service.checkAndNotify('biz1', 'b1', []);
    expect(prisma.branchStock.findMany).not.toHaveBeenCalled();
  });

  it('does not notify when stock is above the minimum', async () => {
    prisma.branchStock.findMany.mockResolvedValue([
      {
        quantity: decimal(10),
        minQuantity: decimal(5),
        ingredient: { name: 'Queso', unit: 'g' },
        branch: { name: 'Centro' },
      },
    ]);

    await service.checkAndNotify('biz1', 'b1', ['i1']);

    expect(notificationPort.send).not.toHaveBeenCalled();
  });

  it('notifies with a formatted message when stock is below the minimum', async () => {
    prisma.branchStock.findMany.mockResolvedValue([
      {
        quantity: decimal(2),
        minQuantity: decimal(5),
        ingredient: { name: 'Queso', unit: 'g' },
        branch: { name: 'Centro' },
      },
    ]);

    await service.checkAndNotify('biz1', 'b1', ['i1']);

    expect(notificationPort.send).toHaveBeenCalledTimes(1);
    const [businessId, message] = notificationPort.send.mock.calls[0];
    expect(businessId).toBe('biz1');
    expect(message).toContain('Stock bajo — Centro');
    expect(message).toContain('Insumos');
    expect(message).toContain('Queso: 2 g (mínimo: 5 g)');
  });

  it('notifies for productos de reventa bajo mínimo', async () => {
    prisma.branchStock.findMany.mockResolvedValue([]);
    prisma.branchProductStock.findMany.mockResolvedValue([
      {
        quantity: decimal(1),
        minQuantity: decimal(5),
        variant: { name: 'Unidad', product: { name: 'Coca-Cola' } },
        branch: { name: 'Centro' },
      },
    ]);

    await service.checkAndNotify('biz1', 'b1', [], ['v1']);

    expect(notificationPort.send).toHaveBeenCalledTimes(1);
    const [, message] = notificationPort.send.mock.calls[0];
    expect(message).toContain('Productos');
    expect(message).toContain('Coca-Cola (Unidad): 1 unidades (mínimo: 5 unidades)');
  });

  it('does nothing when there are no ingredient nor resale ids to check', async () => {
    await service.checkAndNotify('biz1', 'b1', [], []);
    expect(prisma.branchStock.findMany).not.toHaveBeenCalled();
    expect(prisma.branchProductStock.findMany).not.toHaveBeenCalled();
  });

  it('swallows errors instead of throwing (never blocks the sale)', async () => {
    prisma.branchStock.findMany.mockRejectedValue(new Error('db down'));

    await expect(service.checkAndNotify('biz1', 'b1', ['i1'])).resolves.toBeUndefined();
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PaymentValidationService } from './payment-validation.service';
import { OrdersGateway } from '../orders/realtime/orders.gateway';

describe('PaymentValidationService', () => {
  let service: PaymentValidationService;
  let ordersGateway: { emitPaymentMatched: jest.Mock };
  let now: number;

  beforeEach(async () => {
    now = Date.parse('2026-07-06T12:00:00.000Z');
    jest.spyOn(Date, 'now').mockImplementation(() => now);

    ordersGateway = { emitPaymentMatched: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [PaymentValidationService, { provide: OrdersGateway, useValue: ordersGateway }],
    }).compile();

    service = module.get(PaymentValidationService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('no emite match mientras no llega ninguna notificación', () => {
    service.start('b1', 'cashier1', 45);
    expect(ordersGateway.emitPaymentMatched).not.toHaveBeenCalled();
  });

  it('emite match cuando llega una notificación con el mismo monto', () => {
    const { requestId } = service.start('b1', 'cashier1', 45);

    service.reportNotification('b1', 45, 'Juan Perez', 'Recibiste un pago de Bs45.00 de Juan Perez');

    expect(ordersGateway.emitPaymentMatched).toHaveBeenCalledWith('b1', {
      requestId,
      notificationId: expect.any(String),
      amount: 45,
      payerName: 'Juan Perez',
      rawText: 'Recibiste un pago de Bs45.00 de Juan Perez',
    });
  });

  it('no matchea notificaciones de otra sucursal', () => {
    service.start('b1', 'cashier1', 45);

    service.reportNotification('b2', 45, 'Juan Perez', 'texto');

    expect(ordersGateway.emitPaymentMatched).not.toHaveBeenCalled();
  });

  it('matchea de inmediato si la notificación llegó antes que el cajero apretara "Validar pago"', () => {
    service.reportNotification('b1', 45, 'Juan Perez', 'texto');
    expect(ordersGateway.emitPaymentMatched).not.toHaveBeenCalled();

    const { requestId } = service.start('b1', 'cashier1', 45);

    expect(ordersGateway.emitPaymentMatched).toHaveBeenCalledWith('b1', expect.objectContaining({ requestId, payerName: 'Juan Perez' }));
  });

  it('con dos requests pendientes del mismo monto, matchea el más antiguo primero (FIFO)', () => {
    const { requestId: first } = service.start('b1', 'cashier1', 45);
    now += 1000;
    service.start('b1', 'cashier2', 45);

    service.reportNotification('b1', 45, 'Juan Perez', 'texto');

    expect(ordersGateway.emitPaymentMatched).toHaveBeenCalledTimes(1);
    expect(ordersGateway.emitPaymentMatched).toHaveBeenCalledWith('b1', expect.objectContaining({ requestId: first }));
  });

  it('un request ya matcheado no vuelve a matchear con una notificación nueva del mismo monto (le toca al siguiente en la fila)', () => {
    const { requestId: first } = service.start('b1', 'cashier1', 45);
    now += 1000;
    const { requestId: second } = service.start('b1', 'cashier2', 45);

    service.reportNotification('b1', 45, 'Juan Perez', 'pago 1');
    expect(ordersGateway.emitPaymentMatched).toHaveBeenLastCalledWith('b1', expect.objectContaining({ requestId: first }));

    service.reportNotification('b1', 45, 'Maria Lopez', 'pago 2');
    expect(ordersGateway.emitPaymentMatched).toHaveBeenLastCalledWith('b1', expect.objectContaining({ requestId: second }));
  });

  it('"Actualizar" descarta el match y busca otro candidato ya guardado', () => {
    const { requestId } = service.start('b1', 'cashier1', 45);
    service.reportNotification('b1', 45, 'Persona Equivocada', 'texto 1');
    const firstNotificationId = ordersGateway.emitPaymentMatched.mock.calls[0][1].notificationId;

    service.reportNotification('b1', 45, 'Juan Perez', 'texto 2');
    service.reject(requestId, firstNotificationId);

    expect(ordersGateway.emitPaymentMatched).toHaveBeenCalledTimes(2);
    expect(ordersGateway.emitPaymentMatched).toHaveBeenLastCalledWith(
      'b1',
      expect.objectContaining({ requestId, payerName: 'Juan Perez' }),
    );
  });

  it('lanza NotFoundException si se rechaza un request que ya no existe', () => {
    expect(() => service.reject('no-existe', 'n1')).toThrow(NotFoundException);
  });

  it('"Cancelar" borra el request y una notificación posterior ya no lo matchea', () => {
    const { requestId } = service.start('b1', 'cashier1', 45);
    service.cancel(requestId);

    service.reportNotification('b1', 45, 'Juan Perez', 'texto');

    expect(ordersGateway.emitPaymentMatched).not.toHaveBeenCalled();
  });

  it('una notificación fuera de la ventana de tiempo ya no matchea (expiró)', () => {
    service.start('b1', 'cashier1', 45);

    now += 6 * 60 * 1000; // 6 min > ventana default de 5 min
    service.reportNotification('b1', 45, 'Juan Perez', 'texto');

    expect(ordersGateway.emitPaymentMatched).not.toHaveBeenCalled();
  });
});

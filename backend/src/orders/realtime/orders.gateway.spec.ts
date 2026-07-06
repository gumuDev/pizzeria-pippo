import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { OrdersGateway } from './orders.gateway';
import { AuthService } from '../../auth/auth.service';

describe('OrdersGateway', () => {
  let gateway: OrdersGateway;
  let authService: { resolveUserFromToken: jest.Mock };

  function fakeClient(handshake: { auth?: object; query?: object }) {
    return {
      handshake,
      join: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn(),
    };
  }

  beforeEach(async () => {
    authService = { resolveUserFromToken: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [OrdersGateway, { provide: AuthService, useValue: authService }],
    }).compile();

    gateway = module.get(OrdersGateway);
  });

  it('desconecta si no viene token en el handshake', async () => {
    const client = fakeClient({ auth: {}, query: {} });

    await gateway.handleConnection(client as never);

    expect(client.disconnect).toHaveBeenCalled();
    expect(authService.resolveUserFromToken).not.toHaveBeenCalled();
  });

  it('desconecta si el token es inválido', async () => {
    authService.resolveUserFromToken.mockRejectedValue(new UnauthorizedException());
    const client = fakeClient({ auth: { token: 'malo' }, query: {} });

    await gateway.handleConnection(client as never);

    expect(client.disconnect).toHaveBeenCalled();
    expect(client.join).not.toHaveBeenCalled();
  });

  it('une al cliente a la sala de su propia sucursal cuando no viene branchId en la query', async () => {
    authService.resolveUserFromToken.mockResolvedValue({ id: 'u1', role: 'cajero', branch_id: 'b1', full_name: 'x', business_id: null });
    const client = fakeClient({ auth: { token: 'bueno' }, query: {} });

    await gateway.handleConnection(client as never);

    expect(client.join).toHaveBeenCalledWith('branch:b1');
    expect(client.disconnect).not.toHaveBeenCalled();
  });

  it('prioriza el branchId de la query sobre el del perfil (admin eligiendo sucursal)', async () => {
    authService.resolveUserFromToken.mockResolvedValue({ id: 'u1', role: 'admin', branch_id: null, full_name: 'x', business_id: null });
    const client = fakeClient({ auth: { token: 'bueno' }, query: { branchId: 'b2' } });

    await gateway.handleConnection(client as never);

    expect(client.join).toHaveBeenCalledWith('branch:b2');
  });

  it('desconecta si no hay ninguna sucursal resoluble (admin sin sucursal fija ni query)', async () => {
    authService.resolveUserFromToken.mockResolvedValue({ id: 'u1', role: 'admin', branch_id: null, full_name: 'x', business_id: null });
    const client = fakeClient({ auth: { token: 'bueno' }, query: {} });

    await gateway.handleConnection(client as never);

    expect(client.disconnect).toHaveBeenCalled();
    expect(client.join).not.toHaveBeenCalled();
  });
});

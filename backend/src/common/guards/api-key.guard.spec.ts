import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ApiKeyGuard } from './api-key.guard';
import type { DevicesService, AuthenticatedDevice } from '../../devices/devices.service';

describe('ApiKeyGuard', () => {
  let guard: ApiKeyGuard;
  let devicesService: jest.Mocked<Pick<DevicesService, 'verifyApiKey'>>;

  const makeContext = (headers: Record<string, string>): ExecutionContext & { request: { device?: AuthenticatedDevice } } => {
    const request: { headers: Record<string, string>; device?: AuthenticatedDevice } = { headers };
    return {
      switchToHttp: () => ({ getRequest: () => request }),
      request,
    } as unknown as ExecutionContext & { request: { device?: AuthenticatedDevice } };
  };

  beforeEach(() => {
    devicesService = { verifyApiKey: jest.fn() };
    guard = new ApiKeyGuard(devicesService as unknown as DevicesService);
  });

  it('permite el acceso y adjunta el dispositivo cuando el API key es válido', async () => {
    const device: AuthenticatedDevice = { id: 'd1', branchId: 'b1' };
    devicesService.verifyApiKey.mockResolvedValue(device);

    const context = makeContext({ 'x-device-api-key': 'valid-key' });
    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(context.request.device).toEqual(device);
  });

  it('rechaza si falta el header del API key', async () => {
    const context = makeContext({});
    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('rechaza si el API key no corresponde a ningún dispositivo activo', async () => {
    devicesService.verifyApiKey.mockResolvedValue(null);
    const context = makeContext({ 'x-device-api-key': 'wrong-key' });
    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });
});

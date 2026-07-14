import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { DevicesService } from '../../devices/devices.service';

// Authenticates a non-browser client (the Yape notification listener phone)
// that has no user/role in the system. The branchId comes from the matched
// device, never from the request body — a misconfigured phone can't report
// payments for a branch it isn't registered to.
@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly devicesService: DevicesService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-device-api-key'];
    if (!apiKey || typeof apiKey !== 'string') {
      throw new UnauthorizedException('Falta el API key del dispositivo');
    }

    const device = await this.devicesService.verifyApiKey(apiKey);
    if (!device) {
      throw new UnauthorizedException('API key inválido');
    }

    request.device = device;
    return true;
  }
}

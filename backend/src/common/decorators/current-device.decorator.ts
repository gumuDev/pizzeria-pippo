import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthenticatedDevice } from '../../devices/devices.service';

export const CurrentDevice = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): AuthenticatedDevice => {
    const request = ctx.switchToHttp().getRequest();
    return request.device;
  },
);

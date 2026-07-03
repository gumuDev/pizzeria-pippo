import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import type { CurrentUserPayload } from '../../auth/types/jwt.types';

@Injectable()
export class OwnBranchOrAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user: CurrentUserPayload | undefined = request.user;
    if (!user) {
      throw new ForbiddenException('No tenés permiso para acceder a este recurso');
    }
    if (user.role === 'admin') return true;

    const resourceBranchId = request.query?.branchId ?? request.body?.branch_id;
    if (resourceBranchId && resourceBranchId === user.branch_id) return true;

    throw new ForbiddenException('No tenés permiso para acceder a este recurso');
  }
}

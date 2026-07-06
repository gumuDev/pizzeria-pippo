import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import type { CurrentUserPayload, SupabaseJwtPayload } from './types/jwt.types';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  // Mirrors JwtStrategy.validate — needed separately because WebSocket
  // connections have no Passport middleware verifying the token automatically
  // the way JwtAuthGuard does for HTTP requests.
  async resolveUserFromToken(token: string): Promise<CurrentUserPayload> {
    let payload: SupabaseJwtPayload;
    try {
      payload = this.jwtService.verify<SupabaseJwtPayload>(token, {
        secret: process.env.SUPABASE_JWT_SECRET,
      });
    } catch {
      throw new UnauthorizedException('Token inválido o expirado');
    }

    const profile = await this.prisma.profile.findUnique({ where: { id: payload.sub } });
    if (!profile) throw new UnauthorizedException('Perfil no encontrado');

    return {
      id: profile.id,
      role: profile.role,
      branch_id: profile.branchId,
      full_name: profile.fullName,
      business_id: profile.businessId,
    };
  }
}

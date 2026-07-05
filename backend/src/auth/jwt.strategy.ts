import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';
import type { CurrentUserPayload, SupabaseJwtPayload } from './types/jwt.types';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    if (!process.env.SUPABASE_JWT_SECRET) {
      throw new Error('SUPABASE_JWT_SECRET no está configurado (ver backend/.env)');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.SUPABASE_JWT_SECRET,
    });
  }

  async validate(payload: SupabaseJwtPayload): Promise<CurrentUserPayload> {
    const profile = await this.prisma.profile.findUnique({
      where: { id: payload.sub },
    });
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

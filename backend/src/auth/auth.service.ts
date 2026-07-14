import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { PasswordHasherService } from './password/password-hasher.service';
import { toCurrentUserPayload } from './current-user.mapper';
import type { AppJwtPayload, CurrentUserPayload } from './types/jwt.types';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly passwordHasher: PasswordHasherService,
  ) {}

  async login(email: string, password: string): Promise<{ access_token: string; user: CurrentUserPayload }> {
    const profile = await this.prisma.profile.findUnique({ where: { email } });
    // Same generic message for nonexistent email, wrong password, or a
    // banned user — prevents the response from letting attackers enumerate users.
    if (!profile || profile.isBanned) throw new UnauthorizedException('Credenciales incorrectas');

    const passwordMatches = await this.passwordHasher.compare(password, profile.passwordHash);
    if (!passwordMatches) throw new UnauthorizedException('Credenciales incorrectas');

    return {
      // jsonwebtoken types expiresIn as `number | StringValue` (a narrowed
      // literal from the `ms` lib), but an env var is always `string` at
      // compile time — the real value ("10h") does match the expected
      // pattern at runtime.
      access_token: this.jwtService.sign(
        { sub: profile.id },
        { secret: process.env.JWT_SECRET, expiresIn: (process.env.JWT_EXPIRES_IN ?? '10h') as unknown as number },
      ),
      user: toCurrentUserPayload(profile),
    };
  }

  // Mirrors JwtStrategy.validate — needed separately because WebSocket
  // connections have no Passport middleware verifying the token automatically
  // the way JwtAuthGuard does for HTTP requests.
  async resolveUserFromToken(token: string): Promise<CurrentUserPayload> {
    let payload: AppJwtPayload;
    try {
      payload = this.jwtService.verify<AppJwtPayload>(token, { secret: process.env.JWT_SECRET });
    } catch {
      throw new UnauthorizedException('Token inválido o expirado');
    }

    const profile = await this.prisma.profile.findUnique({ where: { id: payload.sub } });
    if (!profile || profile.isBanned) throw new UnauthorizedException('Perfil no encontrado');

    return toCurrentUserPayload(profile);
  }
}

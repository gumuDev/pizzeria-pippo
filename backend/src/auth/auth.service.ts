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
    // Mismo mensaje genérico para email inexistente, password incorrecta o
    // usuario baneado — evita que la respuesta permita enumerar usuarios.
    if (!profile || profile.isBanned) throw new UnauthorizedException('Credenciales incorrectas');

    const passwordMatches = await this.passwordHasher.compare(password, profile.passwordHash);
    if (!passwordMatches) throw new UnauthorizedException('Credenciales incorrectas');

    return {
      // jsonwebtoken tipa expiresIn como `number | StringValue` (un literal
      // acotado de la lib `ms`), pero una env var siempre es `string` en
      // tiempo de compilación — el valor real ("10h") sí matchea el patrón
      // esperado en runtime.
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

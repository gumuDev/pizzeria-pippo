import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PasswordModule } from './password/password.module';

@Module({
  imports: [
    PassportModule,
    PasswordModule,
    // Sin opciones acá a propósito: JwtModule.register() se evalúa al
    // importar este archivo, antes de que ConfigModule cargue el .env, así
    // que leer process.env.JWT_SECRET en este punto daría undefined. El
    // secret/expiresIn se pasan en cada llamada a sign()/verify() en
    // AuthService, que corre en tiempo de ejecución real.
    JwtModule.register({}),
  ],
  controllers: [AuthController],
  providers: [JwtStrategy, JwtAuthGuard, AuthService],
  exports: [JwtAuthGuard, AuthService],
})
export class AuthModule {}

import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AuthService } from './auth.service';

@Module({
  imports: [PassportModule, JwtModule.register({})],
  providers: [JwtStrategy, JwtAuthGuard, AuthService],
  exports: [JwtAuthGuard, AuthService],
})
export class AuthModule {}

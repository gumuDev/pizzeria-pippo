import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { AUTH_ADMIN_PORT } from './auth-admin/auth-admin.port';
import { SupabaseAuthAdminService } from './auth-admin/supabase-auth-admin.service';

@Module({
  imports: [AuthModule],
  controllers: [UsersController],
  providers: [UsersService, { provide: AUTH_ADMIN_PORT, useClass: SupabaseAuthAdminService }],
})
export class UsersModule {}

import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { StorageController } from './storage.controller';
import { SupabaseStorageService } from './supabase-storage.service';
import { STORAGE_PORT } from './storage.port';

@Module({
  imports: [AuthModule],
  controllers: [StorageController],
  providers: [{ provide: STORAGE_PORT, useClass: SupabaseStorageService }],
})
export class StorageModule {}

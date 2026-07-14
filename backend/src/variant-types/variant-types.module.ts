import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { VariantTypesController } from './variant-types.controller';
import { VariantTypesService } from './variant-types.service';

@Module({
  imports: [AuthModule],
  controllers: [VariantTypesController],
  providers: [VariantTypesService],
})
export class VariantTypesModule {}

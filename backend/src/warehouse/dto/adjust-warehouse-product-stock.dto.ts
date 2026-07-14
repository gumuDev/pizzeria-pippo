import { IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export class AdjustWarehouseProductStockDto {
  @IsUUID()
  variant_id: string;

  @IsNumber()
  real_quantity: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

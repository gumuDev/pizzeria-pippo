import { IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class PurchaseWarehouseProductStockDto {
  @IsUUID()
  variant_id: string;

  @IsNumber()
  quantity: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  min_quantity?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

import { IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class PurchaseWarehouseStockDto {
  @IsUUID()
  ingredient_id: string;

  @IsNumber()
  quantity: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  min_quantity?: number;
}

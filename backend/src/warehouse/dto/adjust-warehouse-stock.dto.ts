import { IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export class AdjustWarehouseStockDto {
  @IsUUID()
  ingredient_id: string;

  @IsNumber()
  real_quantity: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

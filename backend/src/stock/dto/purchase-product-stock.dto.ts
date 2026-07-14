import { IsNumber, IsOptional, IsUUID, Min } from 'class-validator';

export class PurchaseProductStockDto {
  @IsUUID()
  branch_id: string;

  @IsUUID()
  variant_id: string;

  @IsNumber()
  @Min(0)
  quantity: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  min_quantity?: number;
}

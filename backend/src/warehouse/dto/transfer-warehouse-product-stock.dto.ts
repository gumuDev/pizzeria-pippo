import { IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export class TransferWarehouseProductStockDto {
  @IsUUID()
  variant_id: string;

  @IsNumber()
  quantity: number;

  @IsUUID()
  branch_id: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

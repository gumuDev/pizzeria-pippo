import { IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export class TransferWarehouseStockDto {
  @IsUUID()
  ingredient_id: string;

  @IsNumber()
  quantity: number;

  @IsUUID()
  branch_id: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

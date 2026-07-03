import { IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export class AdjustProductStockDto {
  @IsUUID()
  branch_id: string;

  @IsUUID()
  variant_id: string;

  @IsNumber()
  real_quantity: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

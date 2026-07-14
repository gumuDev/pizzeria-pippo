import { IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export class AdjustStockDto {
  @IsUUID()
  branch_id: string;

  @IsUUID()
  ingredient_id: string;

  @IsNumber()
  real_quantity: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

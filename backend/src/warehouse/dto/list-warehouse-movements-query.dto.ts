import { IsDateString, IsIn, IsOptional, IsUUID } from 'class-validator';

const MOVEMENT_TYPES = ['compra', 'transferencia', 'ajuste'] as const;

export class ListWarehouseMovementsQueryDto {
  @IsOptional()
  @IsIn(MOVEMENT_TYPES)
  type?: (typeof MOVEMENT_TYPES)[number];

  @IsOptional()
  @IsUUID()
  ingredientId?: string;

  @IsOptional()
  @IsUUID()
  branchId?: string;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}

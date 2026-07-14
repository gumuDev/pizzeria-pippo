import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsUUID, Min } from 'class-validator';

const MOVEMENT_TYPES = ['compra', 'venta', 'ajuste', 'anulacion'] as const;

export class ListMovementsQueryDto {
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @IsOptional()
  @IsUUID()
  ingredientId?: string;

  @IsOptional()
  @IsIn(MOVEMENT_TYPES)
  type?: (typeof MOVEMENT_TYPES)[number];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number = 10;
}

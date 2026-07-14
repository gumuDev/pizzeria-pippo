import { IsDateString, IsOptional, IsUUID } from 'class-validator';

export class ListWarehouseProductMovementsQueryDto {
  @IsOptional()
  @IsUUID()
  variantId?: string;

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

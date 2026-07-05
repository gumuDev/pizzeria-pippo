import { IsBooleanString, IsOptional, IsString, IsUUID } from 'class-validator';

export class ListPromotionsQueryDto {
  @IsOptional()
  @IsBooleanString()
  showInactive?: string;

  @IsOptional()
  @IsUUID()
  branchId?: string;

  @IsOptional()
  @IsString()
  date?: string;
}

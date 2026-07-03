import { IsUUID } from 'class-validator';

export class ListProductStockQueryDto {
  @IsUUID()
  branchId: string;
}

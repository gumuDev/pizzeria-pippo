import { IsUUID } from 'class-validator';

export class GetKitchenOrdersQueryDto {
  @IsUUID()
  branchId!: string;
}

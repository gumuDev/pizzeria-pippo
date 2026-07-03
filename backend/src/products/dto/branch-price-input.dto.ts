import { IsNumber, IsUUID } from 'class-validator';

export class BranchPriceInputDto {
  @IsUUID()
  branch_id: string;

  @IsNumber()
  price: number;
}

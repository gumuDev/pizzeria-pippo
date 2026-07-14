import { IsNumber, IsUUID, Min } from 'class-validator';

export class UpsertBranchPriceDto {
  @IsUUID()
  variant_id!: string;

  @IsUUID()
  branch_id!: string;

  @IsNumber()
  @Min(0)
  price!: number;
}

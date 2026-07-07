import { IsNumber, IsUUID, Min } from 'class-validator';

export class StartPaymentValidationDto {
  @IsUUID()
  branch_id!: string;

  @IsNumber()
  @Min(0)
  amount!: number;
}

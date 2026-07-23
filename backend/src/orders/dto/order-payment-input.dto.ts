import { IsIn, IsNumber, Min } from 'class-validator';

export class OrderPaymentInputDto {
  @IsIn(['efectivo', 'qr'])
  method!: 'efectivo' | 'qr';

  @IsNumber()
  @Min(0.01)
  amount!: number;
}

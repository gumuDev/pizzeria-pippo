import { IsNumber, IsString, Min } from 'class-validator';

export class ReportPaymentNotificationDto {
  @IsNumber()
  @Min(0)
  amount!: number;

  @IsString()
  payer_name!: string;

  @IsString()
  raw_text!: string;
}

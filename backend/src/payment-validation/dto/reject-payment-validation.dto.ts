import { IsString } from 'class-validator';

export class RejectPaymentValidationDto {
  @IsString()
  request_id!: string;

  @IsString()
  notification_id!: string;
}

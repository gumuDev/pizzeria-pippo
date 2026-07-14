import { IsString } from 'class-validator';

export class CancelPaymentValidationDto {
  @IsString()
  request_id!: string;
}

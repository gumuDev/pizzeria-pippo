import { IsNumber, Min } from 'class-validator';

export class UpdateMinQuantityDto {
  @IsNumber()
  @Min(0)
  min_quantity: number;
}

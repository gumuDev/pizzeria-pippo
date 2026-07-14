import { IsNumber, Min } from 'class-validator';

export class UpdateWarehouseMinQuantityDto {
  @IsNumber()
  @Min(0)
  min_quantity: number;
}

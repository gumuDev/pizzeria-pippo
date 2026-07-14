import { Type } from 'class-transformer';
import { IsArray, IsInt, IsOptional, IsPositive, IsUUID, ValidateNested } from 'class-validator';
import { OrderItemFlavorInputDto } from './order-item-flavor-input.dto';

export class OrderItemInputDto {
  @IsUUID()
  variant_id!: string;

  @IsInt()
  @IsPositive()
  qty!: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemFlavorInputDto)
  flavors?: OrderItemFlavorInputDto[] | null;
}

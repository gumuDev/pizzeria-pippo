import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Min,
  ValidateNested,
} from 'class-validator';
import { OrderItemInputDto } from './order-item-input.dto';

export class CreateOrderDto {
  @IsUUID()
  branch_id!: string;

  @IsNumber()
  @Min(0)
  total!: number;

  @IsOptional()
  @IsIn(['efectivo', 'qr'])
  payment_method?: 'efectivo' | 'qr' | null;

  @IsIn(['dine_in', 'takeaway'])
  order_type!: 'dine_in' | 'takeaway';

  @IsOptional()
  @IsString()
  @Length(8, 64)
  idempotency_key?: string | null;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => OrderItemInputDto)
  items!: OrderItemInputDto[];
}

import { IsOptional, IsPositive, IsString, IsUUID, Max } from 'class-validator';

export class OrderItemFlavorInputDto {
  @IsUUID()
  variant_id!: string;

  @IsPositive()
  @Max(1)
  proportion!: number;

  @IsOptional()
  @IsString()
  product_name?: string;
}

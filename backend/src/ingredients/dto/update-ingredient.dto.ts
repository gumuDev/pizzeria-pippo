import { IsBoolean, IsIn, IsOptional, IsString } from 'class-validator';

const UNITS = ['g', 'kg', 'ml', 'l', 'unidad'] as const;

export class UpdateIngredientDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsIn(UNITS)
  unit?: (typeof UNITS)[number];

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

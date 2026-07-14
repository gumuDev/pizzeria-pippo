import { IsBoolean, IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

const UNITS = ['g', 'kg', 'ml', 'l', 'unidad'] as const;

export class CreateIngredientDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsIn(UNITS)
  unit: (typeof UNITS)[number];

  @IsOptional()
  @IsBoolean()
  is_shared_use?: boolean;
}

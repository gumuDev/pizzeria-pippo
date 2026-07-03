import { IsIn, IsNotEmpty, IsString } from 'class-validator';

const UNITS = ['g', 'kg', 'ml', 'l', 'unidad'] as const;

export class CreateIngredientDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsIn(UNITS)
  unit: (typeof UNITS)[number];
}

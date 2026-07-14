import { IsIn, IsNumber, IsOptional, IsUUID } from 'class-validator';

const APPLY_CONDITIONS = ['always', 'takeaway', 'dine_in'] as const;

export class RecipeInputDto {
  @IsUUID()
  ingredient_id: string;

  @IsNumber()
  quantity: number;

  @IsOptional()
  @IsIn(APPLY_CONDITIONS)
  apply_condition?: (typeof APPLY_CONDITIONS)[number];
}

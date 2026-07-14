import { Type } from 'class-transformer';
import { IsArray, IsNumber, IsString, ValidateNested } from 'class-validator';
import { BranchPriceInputDto } from './branch-price-input.dto';
import { RecipeInputDto } from './recipe-input.dto';

export class VariantInputDto {
  @IsString()
  name: string;

  @IsNumber()
  base_price: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BranchPriceInputDto)
  branch_prices: BranchPriceInputDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecipeInputDto)
  recipes: RecipeInputDto[];
}

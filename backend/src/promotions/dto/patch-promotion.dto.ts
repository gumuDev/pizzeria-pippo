import { IsBoolean, IsOptional } from 'class-validator';

export class PatchPromotionDto {
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

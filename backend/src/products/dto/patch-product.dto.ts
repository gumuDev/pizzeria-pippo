import { IsBoolean } from 'class-validator';

export class PatchProductDto {
  @IsBoolean()
  is_active: boolean;
}

import { IsBoolean } from 'class-validator';

export class PatchVariantTypeDto {
  @IsBoolean()
  is_active!: boolean;
}

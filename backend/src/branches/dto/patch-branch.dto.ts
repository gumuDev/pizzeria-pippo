import { IsBoolean } from 'class-validator';

export class PatchBranchDto {
  @IsBoolean()
  is_active: boolean;
}

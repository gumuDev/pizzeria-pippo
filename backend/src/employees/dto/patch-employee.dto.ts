import { IsBoolean } from 'class-validator';

export class PatchEmployeeDto {
  @IsBoolean()
  is_active: boolean;
}

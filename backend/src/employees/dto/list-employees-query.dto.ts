import { IsBooleanString, IsOptional, IsUUID } from 'class-validator';

export class ListEmployeesQueryDto {
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @IsOptional()
  @IsBooleanString()
  showInactive?: string;
}

import { IsBooleanString, IsOptional } from 'class-validator';

export class ListBranchesQueryDto {
  @IsOptional()
  @IsBooleanString()
  showInactive?: string;
}

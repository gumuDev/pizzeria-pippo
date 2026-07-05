import { IsOptional, IsString } from 'class-validator';

export class UpdateBranchDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  address?: string;
}

import { IsIn, IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdateUserDto {
  @IsString()
  full_name!: string;

  @IsIn(['admin', 'cajero', 'cocinero'])
  role!: string;

  @IsOptional()
  @IsUUID()
  branch_id?: string;
}

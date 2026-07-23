import { IsString, IsUUID, MinLength } from 'class-validator';

export class CreateEmployeeDto {
  @IsUUID()
  branch_id!: string;

  @IsString()
  @MinLength(2)
  full_name!: string;

  @IsString()
  @MinLength(2)
  position!: string;
}

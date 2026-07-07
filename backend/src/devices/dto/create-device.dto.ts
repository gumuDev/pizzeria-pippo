import { IsString, IsUUID, MinLength } from 'class-validator';

export class CreateDeviceDto {
  @IsUUID()
  branch_id!: string;

  @IsString()
  @MinLength(3)
  name!: string;
}

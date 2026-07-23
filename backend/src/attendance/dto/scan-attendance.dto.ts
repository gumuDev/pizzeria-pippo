import { IsOptional, IsString } from 'class-validator';

export class ScanAttendanceDto {
  @IsOptional()
  @IsString()
  token?: string;

  @IsOptional()
  @IsString()
  manual_code?: string;
}

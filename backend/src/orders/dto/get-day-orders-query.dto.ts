import { IsOptional, IsUUID, Matches } from 'class-validator';

export class GetDayOrdersQueryDto {
  @IsUUID()
  branchId!: string;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date?: string;
}

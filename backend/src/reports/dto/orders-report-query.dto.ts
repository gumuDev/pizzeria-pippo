import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';
import { ReportQueryDto } from './report-query.dto';

export class OrdersReportQueryDto extends ReportQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number = 20;
}

import { IsOptional, IsUUID } from 'class-validator';
import { ReportQueryDto } from './report-query.dto';

export class CashierReportQueryDto extends ReportQueryDto {
  @IsOptional()
  @IsUUID()
  cashierId?: string;
}

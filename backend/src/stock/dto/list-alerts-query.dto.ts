import { IsOptional, IsUUID } from 'class-validator';

export class ListAlertsQueryDto {
  @IsOptional()
  @IsUUID()
  branchId?: string;
}

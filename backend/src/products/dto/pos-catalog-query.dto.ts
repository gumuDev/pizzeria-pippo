import { IsUUID } from 'class-validator';

export class PosCatalogQueryDto {
  @IsUUID()
  branchId!: string;
}

import { IsBooleanString, IsOptional } from 'class-validator';

export class ListVariantTypesQueryDto {
  @IsOptional()
  @IsBooleanString()
  onlyActive?: string;
}

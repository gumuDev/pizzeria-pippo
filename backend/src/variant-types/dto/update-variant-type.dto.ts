import { IsString, MinLength } from 'class-validator';

export class UpdateVariantTypeDto {
  @IsString()
  @MinLength(1)
  name!: string;
}

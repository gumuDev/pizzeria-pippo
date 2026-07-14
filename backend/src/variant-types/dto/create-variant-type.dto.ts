import { IsString, MinLength } from 'class-validator';

export class CreateVariantTypeDto {
  @IsString()
  @MinLength(1)
  name!: string;
}

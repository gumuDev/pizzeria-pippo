import { IsString } from 'class-validator';

export class RawSettingEntryDto {
  @IsString()
  key!: string;

  @IsString()
  value!: string;
}

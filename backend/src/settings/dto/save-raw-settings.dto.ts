import { ArrayMinSize, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { RawSettingEntryDto } from './raw-setting-entry.dto';

export class SaveRawSettingsDto {
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => RawSettingEntryDto)
  updates!: RawSettingEntryDto[];
}

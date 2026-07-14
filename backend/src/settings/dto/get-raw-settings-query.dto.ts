import { IsString } from 'class-validator';

export class GetRawSettingsQueryDto {
  // Comma-separated list of keys, e.g. "ai_provider,telegram_ai_model".
  @IsString()
  keys!: string;
}

import { IsString } from 'class-validator';

export class GetRawSettingsQueryDto {
  // Lista de keys separadas por coma, ej: "ai_provider,telegram_ai_model".
  @IsString()
  keys!: string;
}

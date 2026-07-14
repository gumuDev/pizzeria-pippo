import { IsString, MinLength } from 'class-validator';

export class TestTelegramDto {
  @IsString()
  @MinLength(1)
  telegram_bot_token!: string;

  @IsString()
  @MinLength(1)
  telegram_chat_id!: string;
}

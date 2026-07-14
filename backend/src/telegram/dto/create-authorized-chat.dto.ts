import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

const CHAT_TYPES = ['personal', 'group'] as const;
const PLANS = ['basic', 'pro', 'unlimited'] as const;

export class CreateAuthorizedChatDto {
  @IsString()
  @IsNotEmpty()
  chat_id: string;

  @IsIn(CHAT_TYPES)
  type: (typeof CHAT_TYPES)[number];

  @IsOptional()
  @IsString()
  label?: string;

  @IsOptional()
  @IsIn(PLANS)
  plan?: (typeof PLANS)[number];
}

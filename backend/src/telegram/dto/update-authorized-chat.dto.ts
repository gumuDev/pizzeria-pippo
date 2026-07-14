import { IsBoolean, IsIn, IsOptional, IsString } from 'class-validator';

const PLANS = ['basic', 'pro', 'unlimited'] as const;

export class UpdateAuthorizedChatDto {
  @IsOptional()
  @IsString()
  label?: string;

  @IsOptional()
  @IsIn(PLANS)
  plan?: (typeof PLANS)[number];

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export type ChatPlan = "basic" | "pro" | "unlimited";
export type ChatType = "personal" | "group";

export interface AuthorizedChat {
  id: string;
  chat_id: string;
  type: ChatType;
  label: string;
  plan: ChatPlan;
  is_active: boolean;
  created_at: string;
  messages_today: number;
}

export interface ChatFormValues {
  chat_id: string;
  type: ChatType;
  label: string;
  plan: ChatPlan;
}

export type AIProvider = "anthropic" | "openai_compatible";

export interface BotSettings {
  telegram_ai_enabled: boolean;
  ai_provider: AIProvider;
  anthropic_api_key: string;
  openai_compatible_api_key: string;
  openai_compatible_base_url: string;
  telegram_ai_model: string;
  telegram_plan_basic_limit: number;
  telegram_plan_pro_limit: number;
}

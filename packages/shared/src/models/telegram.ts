export type TelegramChatType = "personal" | "group";
export type TelegramPlan = "basic" | "pro" | "unlimited";

export interface TelegramAuthorizedChat {
  id: string;
  chat_id: string;
  type: TelegramChatType;
  label: string;
  plan: TelegramPlan;
  is_active: boolean;
  created_at: string;
  messages_today: number;
}

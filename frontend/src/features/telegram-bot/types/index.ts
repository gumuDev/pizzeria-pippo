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

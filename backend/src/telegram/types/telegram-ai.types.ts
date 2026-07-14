export type TelegramResponseType = 'text' | 'file';

export interface TelegramResponse {
  type: TelegramResponseType;
  content: string | Buffer;
  filename?: string;
}

export type TelegramIntent =
  | 'stock_query'
  | 'stock_alerts'
  | 'sales_summary'
  | 'top_products'
  | 'sales_report_excel'
  | 'promotions_query'
  | 'daily_orders'
  | 'unknown';

export interface TelegramAiParams {
  branch_id?: string;
  from?: string;
  to?: string;
  ingredient_name?: string;
}

export interface TelegramAiResult {
  intent: TelegramIntent;
  params: TelegramAiParams;
}

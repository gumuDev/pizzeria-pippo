import { createClient } from "@supabase/supabase-js";
import { todayInBolivia } from "@/lib/timezone";

export interface StockAlert {
  ingredientName: string;
  currentQty: number;
  minQty: number;
  unit: string;
  branchName: string;
}

/**
 * Builds a Telegram message from stock alerts, grouped by branch.
 */
export function buildStockAlertMessage(alerts: StockAlert[]): string {
  const byBranch: Record<string, StockAlert[]> = {};
  for (const alert of alerts) {
    (byBranch[alert.branchName] ??= []).push(alert);
  }

  const dateStr = todayInBolivia().split("-").reverse().join("/");
  const now = new Date();
  const timeStr = new Date(now.getTime() - 4 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[1]
    .slice(0, 5);

  return Object.entries(byBranch)
    .map(([branch, items]) => {
      const lines = items
        .map((a) => `• ${a.ingredientName}: ${a.currentQty} ${a.unit} (mínimo: ${a.minQty} ${a.unit})`)
        .join("\n");
      return `⚠️ *Stock bajo — ${branch}*\n\n${lines}\n\n_Pizzería Pippo — ${dateStr} ${timeStr}_`;
    })
    .join("\n\n---\n\n");
}

/**
 * Sends a Telegram message using the bot configured in app_settings.
 * Reads token, chat_id and enabled flag from Supabase (service role).
 * Errors are swallowed — this must never block the calling flow.
 */
export async function sendTelegramAlert(message: string): Promise<void> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: rows } = await supabase
      .from("app_settings")
      .select("key, value")
      .in("key", ["telegram_bot_token", "telegram_chat_id", "telegram_enabled"]);

    if (!rows?.length) return;

    const config: Record<string, string> = Object.fromEntries(rows.map((r) => [r.key, r.value]));

    if (config["telegram_enabled"] !== "true") return;

    const token = config["telegram_bot_token"];
    const chatId = config["telegram_chat_id"];

    if (!token || !chatId) return;

    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: "Markdown" }),
    });
  } catch (err) {
    console.error("[notifications] sendTelegramAlert error:", err);
  }
}

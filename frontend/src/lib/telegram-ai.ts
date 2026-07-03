import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";
import * as XLSX from "xlsx";
import { todayInBolivia, dateRangeFrom, dateRangeTo } from "@/lib/timezone";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TelegramResponseType = "text" | "file";

export interface TelegramResponse {
  type: TelegramResponseType;
  content: string | Buffer;
  filename?: string;
}

type Intent =
  | "stock_query"
  | "stock_alerts"
  | "sales_summary"
  | "top_products"
  | "sales_report_excel"
  | "promotions_query"
  | "daily_orders"
  | "unknown";

interface AIResult {
  intent: Intent;
  params: {
    branch_id?: string;
    from?: string;
    to?: string;
    ingredient_name?: string;
  };
}

// ---------------------------------------------------------------------------
// Supabase client (service role — no user token required)
// To switch to a per-user token in the future, replace the key below with
// a value read from app_settings (e.g. 'bot_supabase_token').
// ---------------------------------------------------------------------------

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// ---------------------------------------------------------------------------
// App settings loader
// ---------------------------------------------------------------------------

async function loadSettings(keys: string[]): Promise<Record<string, string>> {
  const supabase = getServiceClient();
  const { data } = await supabase
    .from("app_settings")
    .select("key, value")
    .in("key", keys);
  return Object.fromEntries((data ?? []).map((r: { key: string; value: string }) => [r.key, r.value]));
}

// ---------------------------------------------------------------------------
// Branch resolver: name → id
// ---------------------------------------------------------------------------

async function resolveBranches(): Promise<{ id: string; name: string }[]> {
  const supabase = getServiceClient();
  const { data } = await supabase.from("branches").select("id, name");
  return data ?? [];
}

// ---------------------------------------------------------------------------
// System prompt
// ---------------------------------------------------------------------------

function buildSystemPrompt(today: string, branches: { id: string; name: string }[]): string {
  const branchList = branches.map((b) => `- "${b.name}" → id: ${b.id}`).join("\n");
  return `Eres el asistente de gestión de Pizzería Pippo. Solo respondes preguntas sobre ventas, stock, reportes y promociones del restaurante. Si te preguntan algo fuera de ese contexto, responde amablemente que solo puedes ayudar con información del restaurante.

Fecha de hoy en Bolivia: ${today}

Sucursales disponibles:
${branchList}

Cuando el usuario mencione una sucursal por nombre, usa su id correspondiente.
Si no especifica sucursal, omite el campo branch_id (consulta todas).

Para fechas relativas:
- "hoy" → from: "${today}", to: "${today}"
- "ayer" → from y to: día anterior a hoy
- "esta semana" → desde el lunes de la semana actual hasta hoy
- "este mes" → desde el día 1 del mes actual hasta hoy
- Si no menciona fecha, usa hoy por defecto para consultas de ventas.

IMPORTANTE: Responde ÚNICAMENTE con un JSON válido, sin texto adicional, sin bloques de código, sin explicaciones.

Formato de respuesta:
{
  "intent": "<intención>",
  "params": { <parámetros opcionales> }
}

Intenciones disponibles:
- "stock_query" — consulta de stock actual. Params: { branch_id?, ingredient_name? }
- "stock_alerts" — insumos bajo mínimo. Params: { branch_id? }
- "sales_summary" — resumen de ventas. Params: { branch_id?, from?, to? }
- "top_products" — productos más vendidos. Params: { branch_id?, from?, to? }
- "sales_report_excel" — reporte de ventas en Excel. Params: { branch_id?, from?, to? }
- "promotions_query" — promociones activas. Params: { branch_id? }
- "daily_orders" — cantidad de órdenes del día. Params: { branch_id?, from?, to? }
- "unknown" — mensaje no relacionado o no reconocido. Params: {}`;
}

// ---------------------------------------------------------------------------
// Intent handlers
// ---------------------------------------------------------------------------

async function handleStockQuery(params: AIResult["params"]): Promise<string> {
  const supabase = getServiceClient();
  let query = supabase
    .from("branch_stock")
    .select("quantity, min_quantity, ingredients(name, unit), branches(name)");

  if (params.branch_id) query = query.eq("branch_id", params.branch_id);
  if (params.ingredient_name) {
    // Filter by ingredient name (case-insensitive partial match via join)
    const { data: ing } = await supabase
      .from("ingredients")
      .select("id")
      .ilike("name", `%${params.ingredient_name}%`);
    const ids = (ing ?? []).map((i: { id: string }) => i.id);
    if (ids.length) query = query.in("ingredient_id", ids);
  }

  const { data, error } = await query;
  if (error) return `❌ Error al consultar el stock: ${error.message}`;
  if (!data?.length) return "No se encontraron registros de stock.";

  type StockRow = {
    quantity: number;
    min_quantity: number;
    ingredients: { name: string; unit: string } | null;
    branches: { name: string } | null;
  };

  const byBranch: Record<string, StockRow[]> = {};
  for (const row of data as unknown as StockRow[]) {
    const branch = row.branches?.name ?? "Sin sucursal";
    (byBranch[branch] ??= []).push(row);
  }

  const today = todayInBolivia().split("-").reverse().join("/");
  return Object.entries(byBranch)
    .map(([branch, rows]) => {
      const lines = rows
        .map((r) => {
          const warn = r.quantity < r.min_quantity ? " ⚠️" : "";
          return `• ${r.ingredients?.name ?? "?"}: ${r.quantity} ${r.ingredients?.unit ?? ""}${warn}`;
        })
        .join("\n");
      return `📦 *Stock actual — ${branch}*\n\n${lines}\n\n_Consultado el ${today}_`;
    })
    .join("\n\n---\n\n");
}

async function handleStockAlerts(params: AIResult["params"]): Promise<string> {
  const supabase = getServiceClient();
  let query = supabase
    .from("branch_stock")
    .select("quantity, min_quantity, ingredients(name, unit), branches(name)");

  if (params.branch_id) query = query.eq("branch_id", params.branch_id);

  const { data, error } = await query;
  if (error) return `❌ Error al consultar alertas: ${error.message}`;

  type StockRow = {
    quantity: number;
    min_quantity: number;
    ingredients: { name: string; unit: string } | null;
    branches: { name: string } | null;
  };

  const alerts = (data as unknown as StockRow[]).filter((r) => r.quantity < r.min_quantity);
  if (!alerts.length) return "✅ Todo el stock está sobre el mínimo.";

  const byBranch: Record<string, StockRow[]> = {};
  for (const row of alerts) {
    const branch = row.branches?.name ?? "Sin sucursal";
    (byBranch[branch] ??= []).push(row);
  }

  return Object.entries(byBranch)
    .map(([branch, rows]) => {
      const lines = rows
        .map((r) => `• ${r.ingredients?.name}: ${r.quantity} ${r.ingredients?.unit} (mínimo: ${r.min_quantity} ${r.ingredients?.unit})`)
        .join("\n");
      return `⚠️ *Stock bajo — ${branch}*\n\n${lines}`;
    })
    .join("\n\n");
}

async function handleSalesSummary(params: AIResult["params"]): Promise<string> {
  const supabase = getServiceClient();
  const from = params.from ?? todayInBolivia();
  const to = params.to ?? todayInBolivia();

  let query = supabase
    .from("orders")
    .select("total, order_type")
    .gte("created_at", dateRangeFrom(from))
    .lte("created_at", dateRangeTo(to))
    .is("cancelled_at", null);

  if (params.branch_id) query = query.eq("branch_id", params.branch_id);

  const { data, error } = await query;
  if (error) return `❌ Error al consultar ventas: ${error.message}`;

  const orders = data ?? [];
  const total = orders.reduce((s, o) => s + Number(o.total), 0);
  const count = orders.length;
  const avg = count > 0 ? total / count : 0;
  const dateLabel = from === to ? from.split("-").reverse().join("/") : `${from.split("-").reverse().join("/")} al ${to.split("-").reverse().join("/")}`;

  return `💰 *Ventas — ${dateLabel}*\n\nTotal vendido: Bs ${total.toFixed(2)}\nÓrdenes: ${count}\nTicket promedio: Bs ${avg.toFixed(2)}`;
}

async function handleTopProducts(params: AIResult["params"]): Promise<string> {
  const supabase = getServiceClient();
  const from = params.from ?? todayInBolivia();
  const to = params.to ?? todayInBolivia();

  let ordersQuery = supabase
    .from("orders")
    .select("id")
    .gte("created_at", dateRangeFrom(from))
    .lte("created_at", dateRangeTo(to))
    .is("cancelled_at", null);

  if (params.branch_id) ordersQuery = ordersQuery.eq("branch_id", params.branch_id);

  const { data: orders } = await ordersQuery;
  const orderIds = (orders ?? []).map((o: { id: string }) => o.id);
  if (!orderIds.length) return "No hubo ventas en ese período.";

  const { data: items, error } = await supabase
    .from("order_items")
    .select("qty, product_variants(name, products(name))")
    .in("order_id", orderIds);

  if (error) return `❌ Error al consultar productos: ${error.message}`;

  type ItemRow = {
    qty: number;
    product_variants: { name: string; products: { name: string } | null } | null;
  };

  const totals: Record<string, number> = {};
  for (const item of (items ?? []) as unknown as ItemRow[]) {
    const name = `${item.product_variants?.products?.name ?? "?"} (${item.product_variants?.name ?? "?"})`;
    totals[name] = (totals[name] ?? 0) + item.qty;
  }

  const sorted = Object.entries(totals).sort((a, b) => b[1] - a[1]).slice(0, 10);
  const lines = sorted.map(([name, qty], i) => `${i + 1}. ${name}: ${qty} uds`).join("\n");
  const dateLabel = from === to ? from.split("-").reverse().join("/") : `${from.split("-").reverse().join("/")} al ${to.split("-").reverse().join("/")}`;

  return `🏆 *Productos más vendidos — ${dateLabel}*\n\n${lines}`;
}

async function handlePromotionsQuery(params: AIResult["params"]): Promise<string> {
  const supabase = getServiceClient();
  const today = todayInBolivia();

  let query = supabase
    .from("promotions")
    .select("name, type, days_of_week, start_date, end_date")
    .lte("start_date", today)
    .gte("end_date", today);

  if (params.branch_id) query = query.eq("branch_id", params.branch_id);

  const { data, error } = await query;
  if (error) return `❌ Error al consultar promociones: ${error.message}`;
  if (!data?.length) return "No hay promociones activas hoy.";

  const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  const lines = data.map((p: { name: string; type: string; days_of_week: number[] }) => {
    const days = (p.days_of_week ?? []).map((d: number) => dayNames[d]).join(", ");
    return `• ${p.name} (${p.type}) — ${days || "todos los días"}`;
  }).join("\n");

  return `🎁 *Promociones activas hoy*\n\n${lines}`;
}

async function handleSalesExcel(params: AIResult["params"]): Promise<TelegramResponse> {
  const supabase = getServiceClient();
  const from = params.from ?? todayInBolivia();
  const to = params.to ?? todayInBolivia();

  let query = supabase
    .from("orders")
    .select(`
      daily_number, total, created_at, payment_method, order_type,
      branches:branch_id(name),
      order_items(qty, unit_price, discount_applied, product_variants(name, products(name)))
    `)
    .gte("created_at", dateRangeFrom(from))
    .lte("created_at", dateRangeTo(to))
    .is("cancelled_at", null)
    .order("created_at", { ascending: false });

  if (params.branch_id) query = query.eq("branch_id", params.branch_id);

  const { data, error } = await query;
  if (error) return { type: "text", content: `❌ Error al generar el reporte: ${error.message}` };
  if (!data?.length) return { type: "text", content: "No hay ventas en ese período." };

  type OrderRow = {
    daily_number: number;
    total: number;
    created_at: string;
    payment_method: string;
    order_type: string;
    branches: { name: string } | null;
    order_items: Array<{
      qty: number;
      unit_price: number;
      discount_applied: number;
      product_variants: { name: string; products: { name: string } | null } | null;
    }>;
  };

  const rows: (string | number)[][] = [
    ["#", "Sucursal", "Fecha", "Tipo", "Pago", "Total (Bs)", "Productos"],
  ];

  for (const order of data as unknown as OrderRow[]) {
    const products = (order.order_items ?? [])
      .map((i) => `${i.product_variants?.products?.name ?? "?"} ${i.product_variants?.name ?? ""} x${i.qty}`)
      .join(", ");
    const date = new Date(order.created_at).toLocaleDateString("es-BO", { timeZone: "America/La_Paz" });
    rows.push([
      order.daily_number ?? "",
      (order.branches as { name: string } | null)?.name ?? "",
      date,
      order.order_type === "dine_in" ? "Local" : "Para llevar",
      order.payment_method ?? "",
      Number(order.total).toFixed(2),
      products,
    ]);
  }

  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Ventas");
  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;

  const dateLabel = from === to ? from : `${from}_al_${to}`;
  return { type: "file", content: buffer, filename: `ventas_${dateLabel}.xlsx` };
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Provider abstraction — add new providers here without touching the rest
// ---------------------------------------------------------------------------

type AIProvider = "anthropic" | "openai_compatible";

interface ProviderConfig {
  provider: AIProvider;
  apiKey: string;
  model: string;
  baseURL?: string; // for OpenAI-compatible providers (Qwen, Groq, etc.)
}

async function callAI(config: ProviderConfig, system: string, userMessage: string): Promise<string> {
  if (config.provider === "anthropic") {
    const client = new Anthropic({ apiKey: config.apiKey });
    const response = await client.messages.create({
      model: config.model,
      max_tokens: 512,
      system,
      messages: [{ role: "user", content: userMessage }],
    });
    return response.content[0].type === "text" ? response.content[0].text.trim() : "";
  }

  // OpenAI-compatible: Qwen, Groq, Together, OpenAI, etc.
  const client = new OpenAI({
    apiKey: config.apiKey,
    ...(config.baseURL ? { baseURL: config.baseURL } : {}),
  });
  const response = await client.chat.completions.create({
    model: config.model,
    max_tokens: 512,
    messages: [
      { role: "system", content: system },
      { role: "user", content: userMessage },
    ],
  });
  return response.choices[0]?.message?.content?.trim() ?? "";
}

async function resolveProviderConfig(settings: Record<string, string>): Promise<ProviderConfig | null> {
  const provider = (settings["ai_provider"] ?? "anthropic") as AIProvider;

  if (provider === "anthropic") {
    const apiKey = settings["anthropic_api_key"] || process.env.ANTHROPIC_API_KEY || "";
    if (!apiKey) return null;
    return { provider, apiKey, model: settings["telegram_ai_model"] || "claude-haiku-4-5-20251001" };
  }

  // openai_compatible (Qwen, etc.)
  const apiKey = settings["openai_compatible_api_key"] || process.env.OPENAI_COMPATIBLE_API_KEY || "";
  if (!apiKey) return null;
  return {
    provider,
    apiKey,
    model: settings["telegram_ai_model"] || "qwen-plus",
    baseURL: settings["openai_compatible_base_url"] || process.env.OPENAI_COMPATIBLE_BASE_URL || undefined,
  };
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export async function processAIMessage(
  chatId: string,
  userMessage: string
): Promise<TelegramResponse> {
  const settings = await loadSettings([
    "ai_provider",
    "anthropic_api_key",
    "openai_compatible_api_key",
    "openai_compatible_base_url",
    "telegram_ai_model",
  ]);

  const providerConfig = await resolveProviderConfig(settings);
  if (!providerConfig) {
    return { type: "text", content: "❌ El bot de IA no está configurado. Falta la API key del proveedor de IA." };
  }

  const today = todayInBolivia();
  const branches = await resolveBranches();

  let aiResult: AIResult;
  try {
    const text = await callAI(providerConfig, buildSystemPrompt(today, branches), userMessage);
    aiResult = JSON.parse(text) as AIResult;
  } catch (err) {
    console.error("[telegram-ai] processAIMessage error:", err);
    return { type: "text", content: "No pude entender tu mensaje. Intentá con una pregunta sobre ventas, stock o promociones." };
  }

  const { intent, params } = aiResult;

  switch (intent) {
    case "stock_query":
      return { type: "text", content: await handleStockQuery(params) };
    case "stock_alerts":
      return { type: "text", content: await handleStockAlerts(params) };
    case "sales_summary":
    case "daily_orders":
      return { type: "text", content: await handleSalesSummary(params) };
    case "top_products":
      return { type: "text", content: await handleTopProducts(params) };
    case "promotions_query":
      return { type: "text", content: await handlePromotionsQuery(params) };
    case "sales_report_excel":
      return await handleSalesExcel(params);
    default:
      return { type: "text", content: "Solo puedo ayudarte con información del restaurante: ventas, stock, reportes y promociones. ¿En qué te puedo ayudar?" };
  }
}

// ---------------------------------------------------------------------------
// Quota helpers (used by the webhook)
// ---------------------------------------------------------------------------

export async function checkAndIncrementQuota(
  chatId: string,
  plan: string
): Promise<{ allowed: boolean; limit: number; used: number }> {
  const supabase = getServiceClient();
  const settings = await loadSettings([
    `telegram_plan_${plan}_limit`,
    "telegram_plan_basic_limit",
  ]);

  const limit = parseInt(settings[`telegram_plan_${plan}_limit`] ?? settings["telegram_plan_basic_limit"] ?? "10", 10);
  const today = todayInBolivia();

  const { data: usage } = await supabase
    .from("telegram_usage")
    .select("message_count")
    .eq("chat_id", chatId)
    .eq("date", today)
    .single();

  const used = (usage as { message_count: number } | null)?.message_count ?? 0;

  if (used >= limit) return { allowed: false, limit, used };

  await supabase.from("telegram_usage").upsert(
    { chat_id: chatId, date: today, message_count: used + 1, updated_at: new Date().toISOString() },
    { onConflict: "chat_id,date" }
  );

  return { allowed: true, limit, used: used + 1 };
}

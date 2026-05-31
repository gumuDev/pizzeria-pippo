import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { BusinessConfig, DEFAULT_CONFIG } from "@/features/business-config/types/business-config.types";

const BUSINESS_KEYS = ["business_name", "business_type", "business_logo_url", "business_primary_color"] as const;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getAdminContext(req: NextRequest): Promise<{ supabase: any; businessId: string | null } | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);

  const userSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );
  const { data: { user } } = await userSupabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await userSupabase.from("profiles").select("role, business_id").eq("id", user.id).single();
  if (profile?.role !== "admin") return null;

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  return { supabase, businessId: profile.business_id ?? null };
}

export async function GET(req: NextRequest) {
  const ctx = await getAdminContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { supabase, businessId } = ctx;

  const query = supabase.from("app_settings").select("key, value").in("key", BUSINESS_KEYS);
  const { data: rows } = businessId
    ? await query.eq("business_id", businessId)
    : await query.is("business_id", null);

  const map = Object.fromEntries((rows ?? []).map((r: { key: string; value: string }) => [r.key, r.value]));
  const config: BusinessConfig = {
    business_name: map["business_name"] ?? DEFAULT_CONFIG.business_name,
    business_type: (map["business_type"] as BusinessConfig["business_type"]) ?? DEFAULT_CONFIG.business_type,
    business_logo_url: map["business_logo_url"] ?? DEFAULT_CONFIG.business_logo_url,
    business_primary_color: map["business_primary_color"] ?? DEFAULT_CONFIG.business_primary_color,
  };

  return NextResponse.json(config);
}

export async function PUT(req: NextRequest) {
  const ctx = await getAdminContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { supabase, businessId } = ctx;

  const body = await req.json() as Partial<BusinessConfig>;
  const updates = Object.entries(body)
    .filter(([key]) => (BUSINESS_KEYS as readonly string[]).includes(key))
    .map(([key, value]) => ({
      key,
      value: String(value),
      business_id: businessId,
      updated_at: new Date().toISOString(),
    }));

  if (updates.length === 0) return NextResponse.json({ ok: true });

  const { error } = await supabase
    .from("app_settings")
    .upsert(updates, { onConflict: "business_id,key" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { BusinessConfig, DEFAULT_CONFIG } from "@/features/business-config/types/business-config.types";

const BUSINESS_KEYS = ["business_name", "business_type", "business_logo_url", "business_primary_color"];

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("is_active", true)
    .order("created_at")
    .limit(1)
    .single();

  const query = supabase.from("app_settings").select("key, value").in("key", BUSINESS_KEYS);
  const { data: rows } = business
    ? await query.eq("business_id", business.id)
    : await query.is("business_id", null);

  const map = Object.fromEntries((rows ?? []).map((r) => [r.key, r.value]));
  const config: BusinessConfig = {
    business_name: map["business_name"] ?? DEFAULT_CONFIG.business_name,
    business_type: (map["business_type"] as BusinessConfig["business_type"]) ?? DEFAULT_CONFIG.business_type,
    business_logo_url: map["business_logo_url"] ?? DEFAULT_CONFIG.business_logo_url,
    business_primary_color: map["business_primary_color"] ?? DEFAULT_CONFIG.business_primary_color,
  };

  return NextResponse.json(config);
}

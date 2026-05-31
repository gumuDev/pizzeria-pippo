import { createClient } from "@supabase/supabase-js";

let cachedName = "";

export async function getBusinessName(): Promise<string> {
  if (cachedName !== "") return cachedName;
  try {
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

    const query = supabase.from("app_settings").select("value").eq("key", "business_name");
    const { data } = business
      ? await query.eq("business_id", business.id).single()
      : await query.is("business_id", null).single();

    cachedName = data?.value || "Mi Negocio";
    return cachedName;
  } catch {
    return "Mi Negocio";
  }
}

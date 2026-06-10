import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

/**
 * Printer config for the POS. Unlike /api/settings (admin only),
 * any authenticated user (cashier) can read this non-sensitive value.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const token = authHeader.slice(7);

  const userSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );
  const { data: { user } } = await userSupabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const adminSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data, error } = await adminSupabase
    .from("app_settings")
    .select("value")
    .eq("key", "printer_paper_width")
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const width = parseInt(data?.value ?? "58", 10);
  return NextResponse.json({ printer_paper_width: width === 80 ? 80 : 58 });
}

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabaseWithAuth(request: NextRequest) {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "") ?? "";
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = getSupabaseWithAuth(request);
  const body = await request.json();
  const { name, address } = body;

  const { error } = await supabase
    .from("branches")
    .update({ name, address })
    .eq("id", params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = getSupabaseWithAuth(request);
  const { is_active } = await request.json();

  // If deactivating, check for active cashiers assigned to this branch
  if (is_active === false) {
    const { data: cashiers, error: cashiersError } = await supabase
      .from("profiles")
      .select("id, full_name")
      .eq("branch_id", params.id)
      .eq("role", "cajero");

    if (cashiersError) return NextResponse.json({ error: cashiersError.message }, { status: 500 });

    if (cashiers && cashiers.length > 0) {
      return NextResponse.json(
        {
          error: `Hay ${cashiers.length} cajero(s) asignados a esta sucursal. Desactívalos o reasígnalos antes de continuar.`,
          cashiers,
        },
        { status: 409 }
      );
    }
  }

  const { error } = await supabase
    .from("branches")
    .update({ is_active })
    .eq("id", params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  // Soft delete — same as PATCH is_active=false
  const supabase = getSupabaseWithAuth(request);

  const { data: cashiers } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("branch_id", params.id)
    .eq("role", "cajero");

  if (cashiers && cashiers.length > 0) {
    return NextResponse.json(
      {
        error: `Hay ${cashiers.length} cajero(s) asignados a esta sucursal. Desactívalos o reasígnalos antes de continuar.`,
        cashiers,
      },
      { status: 409 }
    );
  }

  const { error } = await supabase
    .from("branches")
    .update({ is_active: false })
    .eq("id", params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

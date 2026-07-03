import { createClient } from "@supabase/supabase-js";
import { NextRequest } from "next/server";
import { AuthError } from "@/lib/errors";

function extractToken(req: NextRequest): string {
  const header = req.headers.get("Authorization");
  if (!header?.startsWith("Bearer ")) throw new AuthError();
  const token = header.slice(7);
  if (!token) throw new AuthError();
  return token;
}

/**
 * Creates a Supabase client authenticated with the request's Bearer token.
 * Validates the token server-side via getUser() — throws AuthError (→ 401)
 * if the token is missing, expired, or invalid.
 * Returns both the client and the validated user.
 */
export async function createAuthClient(req: NextRequest) {
  const token = extractToken(req);
  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );
  const { data: { user } } = await client.auth.getUser();
  if (!user) throw new AuthError();
  return { client, userId: user.id };
}

/**
 * Creates a Supabase client with the service role key (bypasses RLS).
 * Only use server-side where elevated access is needed.
 */
export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

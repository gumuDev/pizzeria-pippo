import { supabase } from "./supabase";

export type UserRole = "admin" | "cajero" | "cocinero";

export interface UserProfile {
  id: string;
  role: UserRole;
  branch_id: string | null;
  full_name: string | null;
}

export async function getUserProfile(): Promise<UserProfile | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("id, role, branch_id, full_name")
    .eq("id", user.id)
    .single();

  if (error || !data) return null;
  return data as UserProfile;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return { user: data.user, session: data.session };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

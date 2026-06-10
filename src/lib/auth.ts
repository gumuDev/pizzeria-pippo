import { supabase } from "./supabase";
import type { Session } from "@supabase/supabase-js";

export type UserRole = "admin" | "cajero" | "cocinero";

// Supabase free plan cannot time-box sessions server-side, so the app enforces it:
// a session older than this (since last sign-in) is signed out locally.
export const SESSION_MAX_HOURS = 6;

export async function getValidSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession();
  const session = data.session;
  if (!session) return null;

  const signedInAt = new Date(session.user.last_sign_in_at ?? 0).getTime();
  const maxAgeMs = SESSION_MAX_HOURS * 60 * 60 * 1000;
  if (Date.now() - signedInAt > maxAgeMs) {
    await supabase.auth.signOut();
    return null;
  }
  return session;
}

export async function getToken(): Promise<string> {
  const session = await getValidSession();
  return session?.access_token ?? "";
}

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

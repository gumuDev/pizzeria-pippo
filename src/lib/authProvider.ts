import { AuthProvider } from "@refinedev/core";
import { supabase } from "./supabase";
import { getUserProfile } from "./auth";

export const authProvider: AuthProvider = {
  login: async ({ email, password }) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return { success: false, error: { message: error.message, name: "Login failed" } };
    }
    return { success: true, redirectTo: "/dashboard" };
  },

  logout: async () => {
    await supabase.auth.signOut();
    return { success: true, redirectTo: "/login" };
  },

  check: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return { authenticated: false, redirectTo: "/login" };
    }
    return { authenticated: true };
  },

  getPermissions: async () => {
    const profile = await getUserProfile();
    return profile?.role ?? null;
  },

  getIdentity: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const profile = await getUserProfile();
    return {
      id: user.id,
      name: profile?.full_name ?? user.email ?? "",
      role: profile?.role,
      branch_id: profile?.branch_id,
      avatar: null,
    };
  },

  onError: async (error) => {
    if (error?.status === 401) {
      return { logout: true };
    }
    return { error };
  },
};

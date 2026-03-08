"use client";

import { useState, useEffect } from "react";
import { PosService } from "../services/pos.service";
import type { Identity } from "../types/pos.types";

export function usePosIdentity() {
  const [identity, setIdentity] = useState<Identity | null>(null);

  useEffect(() => {
    const load = async () => {
      const result = await PosService.getIdentity();
      if (!result) {
        window.location.href = "/login";
        return;
      }
      setIdentity(result);
    };
    load();
  }, []);

  const handleLogout = async () => {
    const { supabase } = await import("@/lib/supabase");
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return { identity, handleLogout };
}

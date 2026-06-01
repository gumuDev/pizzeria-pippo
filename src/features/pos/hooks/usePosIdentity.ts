"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { PosService } from "../services/pos.service";
import type { Identity, Branch } from "../types/pos.types";

export function usePosIdentity() {
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const result = await PosService.getIdentity();
      if (!result) {
        window.location.href = "/login";
        return;
      }
      setIdentity(result);

      // Admin siempre elige sucursal al entrar al POS
      if (result.role === "admin") {
        const { data } = await supabase.from("branches").select("id, name").order("name");
        setBranches(data ?? []);
      }
    };
    load();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  // Cajero: usa su branch_id del perfil. Admin: usa la sucursal elegida en esta sesión.
  const effectiveBranchId = identity?.role === "admin" ? selectedBranchId : (identity?.branch_id ?? null);

  const isAdminChoosingBranch =
    identity !== null &&
    identity.role === "admin" &&
    !selectedBranchId;

  const selectedBranchName = branches.find((b) => b.id === selectedBranchId)?.name ?? null;

  return {
    identity,
    branches,
    effectiveBranchId,
    selectedBranchName,
    isAdminChoosingBranch,
    selectBranch: setSelectedBranchId,
    changeBranch: () => setSelectedBranchId(null),
    handleLogout,
  };
}

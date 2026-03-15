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

      // Admin sin sucursal asignada → cargar lista de sucursales para elegir
      if (result.role === "admin" && !result.branch_id) {
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

  // Para admin: sucursal efectiva es la del perfil (si tiene) o la seleccionada manualmente
  const effectiveBranchId = identity?.branch_id ?? selectedBranchId;

  const isAdminChoosingBranch =
    identity !== null &&
    identity.role === "admin" &&
    !identity.branch_id &&
    !selectedBranchId;

  return {
    identity,
    branches,
    effectiveBranchId,
    isAdminChoosingBranch,
    selectBranch: setSelectedBranchId,
    handleLogout,
  };
}

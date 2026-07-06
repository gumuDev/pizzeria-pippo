"use client";

import { useState, useEffect } from "react";
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

      // Se carga siempre: además de armar el selector para admin sin sucursal
      // fija, alimenta el nombre de sucursal mostrado en el header (PosHeader)
      const data = await PosService.getBranches();
      setBranches(data);
    };
    load();
  }, []);

  const handleLogout = async () => {
    await PosService.logout();
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

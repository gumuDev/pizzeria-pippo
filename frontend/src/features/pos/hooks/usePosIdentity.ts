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

      // Always loaded: besides building the selector for an admin with no
      // fixed branch, it feeds the branch name shown in the header (PosHeader)
      const data = await PosService.getBranches();
      setBranches(data);
    };
    load();
  }, []);

  const handleLogout = async () => {
    await PosService.logout();
    window.location.href = "/login";
  };

  // For admin: effective branch is the profile's (if it has one) or the manually selected one
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

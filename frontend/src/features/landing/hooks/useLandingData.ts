"use client";

import { useState, useEffect } from "react";
import { LandingService } from "../services/landing.service";
import { WHATSAPP_NUMBER } from "../constants/landing.constants";
import type { PublicPizza, PublicBranch } from "../types/landing.types";

export function useLandingData() {
  const [pizzas, setPizzas] = useState<PublicPizza[]>([]);
  const [branches, setBranches] = useState<PublicBranch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([LandingService.getPizzas(), LandingService.getBranches()]).then(([p, b]) => {
      setPizzas(p);
      setBranches(b);
      setLoading(false);
    });
  }, []);

  // Contact number for the general CTAs (header/hero/pizzas), not tied to a
  // specific branch: the first active branch's phone, ordered by name.
  const primaryPhone = branches.find((b) => b.phone)?.phone ?? WHATSAPP_NUMBER;

  return { pizzas, branches, loading, primaryPhone };
}

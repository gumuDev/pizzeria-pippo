"use client";

import { useState, useEffect } from "react";
import { LandingService } from "../services/landing.service";
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

  return { pizzas, branches, loading };
}

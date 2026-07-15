import { API_ENDPOINTS } from "@/lib/api-endpoints";
import type { PublicPizza, PublicBranch } from "../types/landing.types";

const NEST_API_URL = process.env.NEXT_PUBLIC_NEST_API_URL;

// Plain fetch, no auth header — these endpoints are public by design (they
// back the anonymous marketing landing page), unlike the rest of the app's
// services which go through nestFetch()'s Bearer token.
export const LandingService = {
  async getPizzas(): Promise<PublicPizza[]> {
    const res = await fetch(`${NEST_API_URL}${API_ENDPOINTS.public.pizzas}`);
    if (!res.ok) return [];
    return res.json();
  },

  async getBranches(): Promise<PublicBranch[]> {
    const res = await fetch(`${NEST_API_URL}${API_ENDPOINTS.public.branches}`);
    if (!res.ok) return [];
    return res.json();
  },
};

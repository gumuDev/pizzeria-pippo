"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { IngredientsService } from "@/features/ingredients/services/ingredients.service";
import type { Ingredient } from "../types/product.types";

const PAGE_SIZE = 10;
const DEBOUNCE_MS = 300;

// Server-side search for the "add recipe ingredient" select: never loads the
// full ingredients list, so newly created ingredients show up immediately.
export function useIngredientSearch() {
  const [options, setOptions] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const fetchIngredients = useCallback(async (query: string) => {
    setLoading(true);
    const { data } = await IngredientsService.getIngredients({ pageSize: PAGE_SIZE, search: query || undefined });
    setOptions(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchIngredients("");
  }, [fetchIngredients]);

  const search = useCallback((query: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchIngredients(query), DEBOUNCE_MS);
  }, [fetchIngredients]);

  return { options, loading, search };
}

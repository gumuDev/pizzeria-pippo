"use client";

import { useState, useEffect } from "react";
import { ProductFormPage } from "@/features/products/components/ProductFormPage";
import { ProductsService } from "@/features/products/services/products.service";
import type { Ingredient } from "@/features/products/types/product.types";

export default function ProductNewPage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);

  useEffect(() => {
    ProductsService.getIngredients().then(setIngredients);
  }, []);

  return <ProductFormPage ingredients={ingredients} />;
}

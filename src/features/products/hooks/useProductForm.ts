"use client";

import { useState, useEffect } from "react";
import { Form, notification } from "antd";
import { supabase } from "@/lib/supabase";
import { ProductsService } from "../services/products.service";
import type { Product, Variant, Step1Data, RecipeItem, VariantTypeOption } from "../types/product.types";

export function useProductForm(onSuccess: () => void) {
  const [currentStep, setCurrentStep] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [step1Data, setStep1Data] = useState<Step1Data>({ name: "", category: "", description: "", track_stock: true, product_type: "made" });
  const [variantTypeOptions, setVariantTypeOptions] = useState<VariantTypeOption[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [hasRecipe, setHasRecipe] = useState(true);
  const [hasVariants, setHasVariants] = useState(false);

  const toggleHasRecipe = (val: boolean) => {
    setHasRecipe(val);
    if (!val) {
      setVariants((prev) => prev.map((v) => ({ ...v, recipes: [] })));
    }
  };

  const toggleHasVariants = (val: boolean) => {
    setHasVariants(val);
    if (!val) {
      // Switch to simple mode: keep only first variant renamed to "Unidad"
      setVariants((prev) => {
        const first = prev[0] ?? { name: "Unidad", base_price: 0, branch_prices: [], recipes: [] };
        return [{ ...first, name: "Unidad" }];
      });
    } else {
      // Switch to multi-variant mode: rename "Unidad" to first available type
      setVariants((prev) =>
        prev.map((v, i) => i === 0 && v.name === "Unidad" && variantTypeOptions.length > 0
          ? { ...v, name: variantTypeOptions[0].value }
          : v
        )
      );
    }
  };
  const [formStep1] = Form.useForm();

  const getToken = async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? "";
  };

  // Load variant types from DB on mount
  useEffect(() => {
    const loadVariantTypes = async () => {
      const token = await getToken();
      const res = await fetch("/api/variant-types", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const options = data.map((vt: { name: string }) => ({ value: vt.name, label: vt.name }));
        setVariantTypeOptions(options);
        // Initialize with first available type if no variants loaded yet
        setVariants((prev) => prev.length > 0 ? prev : options.length > 0
          ? [{ name: options[0].value, base_price: 0, branch_prices: [], recipes: [] }]
          : []
        );
      }
    };
    loadVariantTypes();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetForm = () => {
    setCurrentStep(0);
    setImageUrl("");
    setStep1Data({ name: "", category: "", description: "", track_stock: true, product_type: "made" });
    setHasRecipe(true);
    setHasVariants(false);
    formStep1.resetFields();
    setVariants([{ name: "Unidad", base_price: 0, branch_prices: [], recipes: [] }]);
  };

  const loadForEdit = async (record: Product) => {
    setCurrentStep(0);
    setImageUrl(record.image_url ?? "");

    const data = await ProductsService.getVariantsWithDetails(record.id);
    const loadedVariants = data.map((v) => ({
      name: v.name,
      base_price: v.base_price,
      branch_prices: v.branch_prices ?? [],
      recipes: v.recipes ?? [],
    }));

    const anyHasRecipeForType = loadedVariants.some((v) => v.recipes.length > 0);
    const productType = anyHasRecipeForType ? "made" : "resale";

    formStep1.setFieldsValue({
      name: record.name,
      category: record.category,
      description: record.description,
      track_stock: record.track_stock ?? true,
      product_type: productType,
    });

    setStep1Data({
      name: record.name,
      category: record.category,
      description: record.description ?? "",
      track_stock: record.track_stock ?? true,
      product_type: productType,
    });

    setVariants(loadedVariants);
    setHasRecipe(anyHasRecipeForType);
    // Simple mode: single variant named "Unidad"
    const isSimple = loadedVariants.length === 1 && loadedVariants[0].name === "Unidad";
    setHasVariants(!isSimple);
  };

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    const token = await getToken();
    const { url, error } = await ProductsService.uploadImage(file, token);
    if (url) {
      setImageUrl(url);
    } else {
      notification.error({ message: error ?? "Error al subir la imagen" });
    }
    setUploading(false);
    return false as const;
  };

  const handleSave = async (editing: Product | null) => {
    setSaving(true);
    const payload = ProductsService.buildPayload(step1Data, imageUrl, variants);
    const token = await getToken();
    const result = editing
      ? await ProductsService.updateProduct(editing.id, payload, token)
      : await ProductsService.createProduct(payload, token);
    setSaving(false);
    if (result.ok) onSuccess();
    else notification.error({ message: result.error });
  };

  const updateVariant = (index: number, field: keyof Variant, value: unknown) => {
    setVariants((prev) => prev.map((v, i) => i === index ? { ...v, [field]: value } : v));
  };

  const addVariant = () => {
    const used = variants.map((v) => v.name);
    const next = variantTypeOptions.find((o) => !used.includes(o.value));
    if (next) {
      setVariants((prev) => [...prev, { name: next.value, base_price: 0, branch_prices: [], recipes: [] }]);
    }
  };

  const removeVariant = (index: number) => {
    setVariants((prev) => prev.filter((_, i) => i !== index));
  };

  const updateBranchPrice = (variantIndex: number, branchId: string, price: number) => {
    const updated = variants[variantIndex].branch_prices.map((bp) =>
      bp.branch_id === branchId ? { ...bp, price } : bp
    );
    updateVariant(variantIndex, "branch_prices", updated);
  };

  const addRecipeItem = (variantIndex: number) => {
    updateVariant(variantIndex, "recipes", [
      ...variants[variantIndex].recipes,
      { ingredient_id: "", quantity: 0, apply_condition: "always" as const },
    ]);
  };

  const updateRecipeItem = (variantIndex: number, recipeIndex: number, field: keyof RecipeItem, value: string | number) => {
    const updated = variants[variantIndex].recipes.map((r, i) =>
      i === recipeIndex ? { ...r, [field]: value } : r
    );
    updateVariant(variantIndex, "recipes", updated);
  };

  const removeRecipeItem = (variantIndex: number, recipeIndex: number) => {
    updateVariant(variantIndex, "recipes", variants[variantIndex].recipes.filter((_, i) => i !== recipeIndex));
  };

  const handleSetStep1Data = (data: Step1Data) => {
    setStep1Data(data);
    // Sync hasRecipe and track_stock from product_type
    const isMade = data.product_type === "made";
    setHasRecipe(isMade);
    setStep1Data({ ...data, track_stock: true });
  };

  return {
    currentStep, setCurrentStep,
    uploading, saving,
    imageUrl,
    step1Data, setStep1Data: handleSetStep1Data,
    variants, variantTypeOptions,
    hasRecipe, setHasRecipe: toggleHasRecipe,
    hasVariants, setHasVariants: toggleHasVariants,
    formStep1,
    resetForm, loadForEdit,
    handleImageUpload, handleSave,
    updateVariant, addVariant, removeVariant,
    updateBranchPrice,
    addRecipeItem, updateRecipeItem, removeRecipeItem,
  };
}

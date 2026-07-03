"use client";

import { useState, useEffect, useRef } from "react";
import { Form, notification } from "antd";
import { getToken } from "@/lib/auth";
import { ProductsService } from "../services/products.service";
import type { Product, Variant, Step1Data, RecipeItem, VariantTypeOption } from "../types/product.types";

export function useProductForm(onSuccess: () => void) {
  const [currentStep, setCurrentStep] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [step1Data, setStep1Data] = useState<Step1Data>({ name: "", category: "", description: "", product_type: "made" });
  const [variantTypeOptions, setVariantTypeOptions] = useState<VariantTypeOption[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [hasRecipe, setHasRecipe] = useState(true);
  const [hasVariants, setHasVariants] = useState(false);
  const savedVariantsRef = useRef<Variant[]>([]);
  const [formStep1] = Form.useForm();

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
      }
    };
    loadVariantTypes();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleHasRecipe = (val: boolean) => {
    setHasRecipe(val);
    if (!val) {
      setVariants((prev) => prev.map((v) => ({ ...v, recipes: [] })));
    }
  };

  const toggleHasVariants = (val: boolean) => {
    setHasVariants(val);
    if (!val) {
      setVariants((prev) => {
        savedVariantsRef.current = prev;
        const first = prev[0] ?? { name: "Unidad", base_price: 0, branch_prices: [], recipes: [] };
        return [{ ...first, name: "Unidad" }];
      });
    } else {
      const saved = savedVariantsRef.current;
      if (saved.length > 0 && !(saved.length === 1 && saved[0].name === "Unidad")) {
        setVariants(saved);
      } else {
        setVariants((prev) =>
          prev.map((v, i) => i === 0 && v.name === "Unidad" && variantTypeOptions.length > 0
            ? { ...v, name: variantTypeOptions[0].value }
            : v
          )
        );
      }
    }
  };

  const resetForm = () => {
    setCurrentStep(0);
    setImageUrl("");
    setStep1Data({ name: "", category: "", description: "", product_type: "made" });
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
      recipes: (v.recipes ?? []).map((r: { ingredient_id: string; quantity: number; apply_condition?: string }) => ({
        ingredient_id: r.ingredient_id,
        quantity: r.quantity,
        apply_condition: r.apply_condition ?? "always",
      })),
      is_active: v.is_active ?? true,
    }));

    const activeVariants = loadedVariants.filter((v) => v.is_active !== false);
    const anyHasRecipe = activeVariants.some((v) => v.recipes.length > 0);
    const productType: "made" | "resale" = record.product_type ?? (anyHasRecipe ? "made" : "resale");
    const isSimple = activeVariants.length === 1 && activeVariants[0].name === "Unidad";
    savedVariantsRef.current = [];

    formStep1.setFieldsValue({
      name: record.name,
      category: record.category,
      description: record.description,
      product_type: productType,
    });

    setStep1Data({
      name: record.name,
      category: record.category,
      description: record.description ?? "",
      product_type: productType,
    });

    setVariants(loadedVariants);
    setHasRecipe(anyHasRecipe);
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

  const handleSetStep1Data = (data: Step1Data) => {
    setStep1Data(data);
    setHasRecipe(data.product_type === "made");
  };

  const updateVariant = (index: number, field: keyof Variant, value: unknown) => {
    setVariants((prev) => prev.map((v, i) => i === index ? { ...v, [field]: value } : v));
  };

  const addVariant = () => {
    const used = variants.map((v) => v.name);
    const next = variantTypeOptions.find((o) => !used.includes(o.value));
    if (next) {
      setVariants((prev) => [...prev, { name: next.value, base_price: 0, branch_prices: [], recipes: [], is_active: true }]);
    }
  };

  const reactivateVariant = (index: number) => {
    setVariants((prev) => prev.map((v, i) => i === index ? { ...v, is_active: true } : v));
  };

  const removeVariant = (index: number) => {
    setVariants((prev) => prev.filter((_, i) => i !== index));
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
    updateVariant, addVariant, removeVariant, reactivateVariant,
    addRecipeItem, updateRecipeItem, removeRecipeItem,
  };
}

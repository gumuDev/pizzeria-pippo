"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Steps, Button, Typography } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { ProductStepGeneral } from "./ProductStepGeneral";
import { ProductStepVariants } from "./ProductStepVariants";
import { ProductStepRecipes } from "./ProductStepRecipes";
import { useProductForm } from "../hooks/useProductForm";
import type { Product, Ingredient } from "../types/product.types";

const { Title } = Typography;

const STEPS_WITH_RECIPES = [
  { title: "Datos generales" },
  { title: "Variantes y precios" },
  { title: "Recetas" },
];

const STEPS_WITHOUT_RECIPES = [
  { title: "Datos generales" },
  { title: "Variantes y precios" },
];

interface Props {
  editing?: Product;
  ingredients: Ingredient[];
}

export function ProductFormPage({ editing, ingredients }: Props) {
  const router = useRouter();
  const form = useProductForm(() => router.push("/products"));
  const isMade = form.step1Data.product_type === "made";
  const steps = isMade ? STEPS_WITH_RECIPES : STEPS_WITHOUT_RECIPES;

  useEffect(() => {
    if (editing) {
      form.loadForEdit(editing);
    } else {
      form.resetForm();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing?.id]);

  return (
    <div style={{ padding: 24, maxWidth: 960, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => router.push("/products")}>
          Volver
        </Button>
        <Title level={4} style={{ margin: 0 }}>
          {editing ? `Editar — ${editing.name}` : "Nuevo producto"}
        </Title>
      </div>

      <Steps current={form.currentStep} items={steps} style={{ marginBottom: 32 }} />

      {form.currentStep === 0 && (
        <ProductStepGeneral
          form={form.formStep1}
          uploading={form.uploading}
          imageUrl={form.imageUrl}
          step1Data={form.step1Data}
          onImageUpload={form.handleImageUpload}
          onNext={() =>
            form.formStep1.validateFields().then((values) => {
              form.setStep1Data(values);
              form.setCurrentStep(1);
            })
          }
        />
      )}

      {form.currentStep === 1 && (
        <ProductStepVariants
          variants={form.variants}
          variantTypeOptions={form.variantTypeOptions}
          hasVariants={form.hasVariants}
          onToggleVariants={form.setHasVariants}
          onUpdateVariant={form.updateVariant}
          onAddVariant={form.addVariant}
          onRemoveVariant={form.removeVariant}
          onReactivateVariant={form.reactivateVariant}
          onPrev={() => form.setCurrentStep(0)}
          onNext={() => (isMade ? form.setCurrentStep(2) : form.handleSave(editing ?? null))}
          nextLabel={isMade ? undefined : editing ? "Guardar" : "Crear"}
          saving={!isMade ? form.saving : false}
        />
      )}

      {isMade && form.currentStep === 2 && (
        <ProductStepRecipes
          variants={form.variants}
          ingredients={ingredients}
          saving={form.saving}
          editing={!!editing}
          hasRecipe={form.hasRecipe}
          onToggleRecipe={form.setHasRecipe}
          onAddRecipeItem={form.addRecipeItem}
          onUpdateRecipeItem={form.updateRecipeItem}
          onRemoveRecipeItem={form.removeRecipeItem}
          onPrev={() => form.setCurrentStep(1)}
          onSave={() => form.handleSave(editing ?? null)}
        />
      )}
    </div>
  );
}

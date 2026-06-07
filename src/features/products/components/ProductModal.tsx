"use client";

import { Modal, Steps } from "antd";
import { useEffect } from "react";
import { ProductStepGeneral } from "./ProductStepGeneral";
import { ProductStepVariants } from "./ProductStepVariants";
import { ProductStepRecipes } from "./ProductStepRecipes";
import { useProductForm } from "../hooks/useProductForm";
import type { Product, Ingredient } from "../types/product.types";

interface Props {
  open: boolean;
  editing: Product | null;
  ingredients: Ingredient[];
  onClose: () => void;
  onSave: () => void;
}

const STEPS_WITH_RECIPES = [
  { title: "Datos generales" },
  { title: "Variantes y precios" },
  { title: "Recetas" },
];

const STEPS_WITHOUT_RECIPES = [
  { title: "Datos generales" },
  { title: "Variantes y precios" },
];

export function ProductModal({ open, editing, ingredients, onClose, onSave }: Props) {
  const form = useProductForm(onSave);
  const isMade = form.step1Data.product_type === "made";
  const steps = isMade ? STEPS_WITH_RECIPES : STEPS_WITHOUT_RECIPES;

  useEffect(() => {
    if (!open) return;
    if (editing) {
      form.loadForEdit(editing);
    } else {
      form.resetForm();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing]);

  return (
    <Modal
      title={editing ? "Editar producto" : "Nuevo producto"}
      open={open}
      onCancel={onClose}
      footer={null}
      width={700}
      destroyOnHidden
    >
      <Steps current={form.currentStep} items={steps} className="my-6" />

      {form.currentStep === 0 && (
        <ProductStepGeneral
          form={form.formStep1}
          uploading={form.uploading}
          imageUrl={form.imageUrl}
          step1Data={form.step1Data}
          onImageUpload={form.handleImageUpload}
          onNext={() => form.formStep1.validateFields().then((values) => {
            form.setStep1Data(values);
            form.setCurrentStep(1);
          })}
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
          onPrev={() => form.setCurrentStep(0)}
          onNext={() => isMade ? form.setCurrentStep(2) : form.handleSave(editing)}
          nextLabel={isMade ? undefined : (editing ? "Guardar" : "Crear")}
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
          onSave={() => form.handleSave(editing)}
        />
      )}
    </Modal>
  );
}

"use client";

import { Modal, Steps } from "antd";
import { useEffect } from "react";
import { ProductStepGeneral } from "./ProductStepGeneral";
import { ProductStepVariants } from "./ProductStepVariants";
import { ProductStepRecipes } from "./ProductStepRecipes";
import { useProductForm } from "../hooks/useProductForm";
import type { Product, Branch, Ingredient } from "../types/product.types";

interface Props {
  open: boolean;
  editing: Product | null;
  branches: Branch[];
  ingredients: Ingredient[];
  onClose: () => void;
  onSave: () => void;
}

const STEPS = [
  { title: "Datos generales" },
  { title: "Variantes y precios" },
  { title: "Recetas" },
];

export function ProductModal({ open, editing, branches, ingredients, onClose, onSave }: Props) {
  const form = useProductForm(onSave);

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
      <Steps current={form.currentStep} items={STEPS} className="my-6" />

      {form.currentStep === 0 && (
        <ProductStepGeneral
          form={form.formStep1}
          branches={branches}
          uploading={form.uploading}
          imageUrl={form.imageUrl}
          step1Data={form.step1Data}
          onBranchChange={(val) => form.setSelectedBranchId(val)}
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
          branches={branches}
          selectedBranchId={form.selectedBranchId}
          onUpdateVariant={form.updateVariant}
          onUpdateBranchPrice={form.updateBranchPrice}
          onAddVariant={form.addVariant}
          onRemoveVariant={form.removeVariant}
          onPrev={() => form.setCurrentStep(0)}
          onNext={() => form.setCurrentStep(2)}
        />
      )}

      {form.currentStep === 2 && (
        <ProductStepRecipes
          variants={form.variants}
          ingredients={ingredients}
          saving={form.saving}
          editing={!!editing}
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

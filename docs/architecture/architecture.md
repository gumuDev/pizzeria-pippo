# Arquitectura de Código — Sistema de Gestión para Restaurante

Este documento define **cómo debe organizarse el código del proyecto** para mantener una arquitectura limpia, mantenible y escalable.

El objetivo es evitar archivos gigantes, separar responsabilidades y permitir que nuevas funcionalidades se agreguen sin romper el sistema existente.

Esta arquitectura está optimizada para:

- Next.js 14 (App Router)
- Refine
- Supabase
- Ant Design
- Tailwind

---

# Principios de Arquitectura

El código debe seguir estos principios:

### 1. Single Responsibility Principle (SRP)

Cada archivo debe tener **una única responsabilidad**.

Ejemplo incorrecto:


products/page.tsx
UI
lógica de negocio
llamadas a API
lógica de formularios
lógica de recetas
lógica de variantes


Esto genera archivos de **800+ líneas difíciles de mantener**.

Ejemplo correcto:


ProductsPage → solo layout
ProductsTable → tabla
ProductModal → modal
useProducts → lógica
products.service → llamadas a backend


---

### 2. Feature-Based Architecture

El código se organiza **por funcionalidad**, no por tipo global.

Incorrecto:


components/
hooks/
services/
types/


Correcto:


features/products/
features/stock/
features/promotions/


Cada feature contiene todo lo necesario para funcionar.

---

# Nueva Estructura del Proyecto


/
├── app/
│
│ ├── api/ # Backend (Next.js Route Handlers)
│ │ ├── products/
│ │ │ └── route.ts
│ │ ├── orders/
│ │ │ └── route.ts
│ │ ├── promotions/
│ │ │ └── route.ts
│ │ ├── stock/
│ │ │ └── route.ts
│ │ └── reports/
│ │ └── route.ts
│
│ ├── (admin)/
│ │ ├── dashboard/page.tsx
│ │ ├── products/page.tsx
│ │ ├── ingredients/page.tsx
│ │ ├── stock/page.tsx
│ │ ├── promotions/page.tsx
│ │ └── reports/page.tsx
│
│ ├── (pos)/
│ │ └── pos/page.tsx
│
│ └── display/
│ └── page.tsx
│
│
├── features/ # Feature-based architecture
│
│ ├── products/
│ │
│ │ ├── components/
│ │ │ ├── ProductsTable.tsx
│ │ │ ├── ProductModal.tsx
│ │ │ ├── ProductStepGeneral.tsx
│ │ │ ├── ProductStepVariants.tsx
│ │ │ ├── ProductStepRecipes.tsx
│ │ │ ├── ProductImage.tsx
│ │ │ └── CategoryIcon.tsx
│ │ │
│ │ ├── hooks/
│ │ │ ├── useProducts.ts
│ │ │ └── useProductForm.ts
│ │ │
│ │ ├── services/
│ │ │ └── products.service.ts
│ │ │
│ │ ├── types/
│ │ │ └── product.types.ts
│ │ │
│ │ └── constants/
│ │ └── product.constants.ts
│
│
│ ├── stock/
│ │
│ │ ├── components/
│ │ ├── hooks/
│ │ ├── services/
│ │ └── types/
│
│
│ ├── promotions/
│ │
│ │ ├── components/
│ │ ├── hooks/
│ │ ├── services/
│ │ └── types/
│
│
│ └── pos/
│ ├── components/
│ ├── hooks/
│ └── services/
│
│
├── shared/ # Código reutilizable global
│
│ ├── components/
│ │ ├── AppTable.tsx
│ │ ├── AppModal.tsx
│ │ └── PageHeader.tsx
│ │
│ ├── hooks/
│ │ └── useAuth.ts
│ │
│ ├── utils/
│ │ ├── currency.ts
│ │ └── format.ts
│ │
│ └── types/
│
│
├── lib/
│ ├── supabase.ts
│ ├── promotions.ts
│ └── recipes.ts
│
│
├── docs/
│
│ ├── architecture-code-structure.md
│ └── database/
│
│
└── public/


---

# Regla Importante para `page.tsx`

Los archivos `page.tsx` **deben ser muy pequeños**.

Máximo recomendado:


50 – 100 líneas


Ejemplo correcto:


app/(admin)/products/page.tsx


```tsx
"use client";

import { ProductsTable } from "@/features/products/components/ProductsTable";
import { ProductModal } from "@/features/products/components/ProductModal";
import { useProducts } from "@/features/products/hooks/useProducts";

export default function ProductsPage() {

  const {
    products,
    loading,
    modalOpen,
    openCreate,
    openEdit,
    closeModal
  } = useProducts();

  return (
    <>
      <ProductsTable
        products={products}
        loading={loading}
        onCreate={openCreate}
        onEdit={openEdit}
      />

      <ProductModal
        open={modalOpen}
        onClose={closeModal}
      />
    </>
  );
}
Separación de Responsabilidades
Page

Responsabilidad:

Layout de la página

Nunca debe contener:

lógica de negocio

llamadas a Supabase

lógica de formularios complejos

Hooks

Responsabilidad:

lógica de estado
lógica de negocio
llamadas a services

Ejemplo:

features/products/hooks/useProducts.ts
Services

Responsabilidad:

comunicación con backend
API calls
Supabase queries

Ejemplo:

features/products/services/products.service.ts

Ejemplo:

export const ProductsService = {

  async getProducts() {
    return supabase
      .from("products")
      .select("*, product_variants(*)")
  },

  async createProduct(payload) {
    return fetch("/api/products", {
      method: "POST",
      body: JSON.stringify(payload)
    })
  }

}
Components

Responsabilidad:

UI

Nunca deben tener:

queries a Supabase
lógica de negocio
Types

Responsabilidad:

interfaces
tipos TypeScript

Ejemplo:

Product
Variant
Recipe
Ingredient
Constants

Responsabilidad:

configuración estática

Ejemplo:

CATEGORY_OPTIONS
VARIANT_OPTIONS
Regla de Tamaño de Archivos

Guía recomendada:

Tipo de archivo	Tamaño máximo
page.tsx	100 líneas
components	200 líneas
hooks	200 líneas
services	150 líneas

Si un archivo supera 300 líneas, debe dividirse.

Reglas Importantes para el Refactor

La IA debe:

NO cambiar lógica existente

NO modificar base de datos

NO cambiar APIs

solo reorganizar código

Objetivo:

mejorar mantenibilidad
Beneficios de esta Arquitectura

archivos pequeños

código fácil de leer

fácil de testear

escalable

evita archivos gigantes

separación clara de responsabilidades

Esta arquitectura es similar a la usada en:

Vercel

Shopify

Linear

SaaS modernos con Next.js

Feature Based Architecture + Clean Components
Regla Final

Si un archivo React supera:

300 líneas

Debe dividirse en:

componentes
hooks
services

Nunca mantener archivos gigantes en page.tsx.
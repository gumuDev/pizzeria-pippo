import { ProductsService } from "@/features/products/services/products.service";
import type { DisplayProduct } from "../types/display.types";

export const DisplayService = {
  async getMenuProducts(): Promise<DisplayProduct[]> {
    const { data } = await ProductsService.getProducts({ pageSize: 9999 });
    // El endpoint ordena por nombre solamente (uso del admin); el display de
    // cliente necesita agrupar por categoría, igual que la query vieja de Supabase.
    return (data as unknown as DisplayProduct[])
      .slice()
      .sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
  },
};

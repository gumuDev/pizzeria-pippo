import { supabase } from "@/lib/supabase";
import type { DisplayProduct } from "../types/display.types";

export const DisplayService = {
  async getMenuProducts(): Promise<DisplayProduct[]> {
    const { data } = await supabase
      .from("products")
      .select("id, name, category, description, image_url, product_variants(id, name, base_price)")
      .eq("is_active", true)
      .order("category")
      .order("name");
    return (data as unknown as DisplayProduct[]) ?? [];
  },
};

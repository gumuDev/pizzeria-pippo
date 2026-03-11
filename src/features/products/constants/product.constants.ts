export const CATEGORY_OPTIONS = [
  { value: "pizza", label: "Pizza" },
  { value: "bebida", label: "Bebida" },
  { value: "otro", label: "Otro" },
];

export const CATEGORY_COLORS: Record<string, string> = {
  pizza: "red",
  bebida: "blue",
  otro: "green",
};

export const CATEGORY_BG: Record<string, string> = {
  pizza: "#fef2f2",
  bebida: "#eff6ff",
  otro: "#f0fdf4",
};

export const CATEGORY_ICON_COLOR: Record<string, string> = {
  pizza: "#f97316",
  bebida: "#3b82f6",
  otro: "#22c55e",
};

export const CATEGORY_EMOJI: Record<string, string> = {
  pizza: "🍕",
  bebida: "🥤",
  otro: "🍽️",
};

// Variant options are now loaded dynamically from variant_types table in the DB

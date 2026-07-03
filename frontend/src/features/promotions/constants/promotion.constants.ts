export const TYPE_OPTIONS = [
  { value: "BUY_X_GET_Y", label: "Compra X llévate Y (ej: 2x1)" },
  { value: "PERCENTAGE", label: "Descuento porcentual" },
  { value: "COMBO", label: "Precio combo" },
];

export const TYPE_COLORS: Record<string, string> = {
  BUY_X_GET_Y: "red",
  PERCENTAGE: "blue",
  COMBO: "green",
};

export const DAYS = [
  { value: 0, label: "Dom" },
  { value: 1, label: "Lun" },
  { value: 2, label: "Mar" },
  { value: 3, label: "Mié" },
  { value: 4, label: "Jue" },
  { value: 5, label: "Vie" },
  { value: 6, label: "Sáb" },
];

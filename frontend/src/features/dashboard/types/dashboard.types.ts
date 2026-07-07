export interface SalesSummary { total: number; count: number; avg: number; }

export interface TopProduct {
  variant_id: string;
  product_name: string;
  variant_name: string;
  category: string;
  qty: number;
  revenue: number;
}

export interface DailyData { date: string; total: number; }

export interface StockAlert {
  id: string;
  quantity: number;
  min_quantity: number;
  ingredients: { name: string; unit: string };
  branches: { name: string };
}

export interface WarehouseAlert {
  id: string;
  ingredient_id: string;
  quantity: number;
  min_quantity: number;
  ingredients: { name: string; unit: string };
}

export interface DashboardData {
  summary: SalesSummary | null;
  topProducts: TopProduct[];
  dailyData: DailyData[];
  stockAlerts: StockAlert[];
  warehouseAlerts: WarehouseAlert[];
}

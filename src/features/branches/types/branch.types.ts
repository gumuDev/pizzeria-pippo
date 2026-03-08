export interface Branch {
  id: string;
  name: string;
  address: string | null;
  created_at: string;
  is_active: boolean;
}

export interface Cashier {
  id: string;
  full_name: string;
}

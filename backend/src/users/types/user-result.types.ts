export interface UserResult {
  id: string;
  email: string;
  full_name: string;
  role: string;
  branch_id: string | null;
  created_at: string;
  is_banned: boolean;
  has_orders: boolean;
}

export type UserRole = "admin" | "cajero" | "cocinero";

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  branch_id: string | null;
  created_at: string;
}

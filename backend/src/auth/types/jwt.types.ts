export interface SupabaseJwtPayload {
  sub: string;
}

export interface CurrentUserPayload {
  id: string;
  role: string;
  branch_id: string | null;
  full_name: string | null;
  business_id: string | null;
}

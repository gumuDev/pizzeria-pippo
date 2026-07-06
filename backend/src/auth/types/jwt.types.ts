export interface AppJwtPayload {
  sub: string;
}

export interface CurrentUserPayload {
  id: string;
  email: string;
  role: string;
  branch_id: string | null;
  full_name: string | null;
  business_id: string | null;
}

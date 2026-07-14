export interface DeviceResult {
  id: string;
  branch_id: string;
  name: string;
  is_active: boolean;
  last_seen_at: string | null;
  created_at: string;
}

export interface AttendanceScanResult {
  employee: { full_name: string };
  type: 'entrada' | 'salida';
  occurred_at: string;
}

export interface AttendanceHistoryRow {
  id: string;
  employee_name: string;
  position: string;
  branch_name: string;
  type: string;
  created_at: string;
}

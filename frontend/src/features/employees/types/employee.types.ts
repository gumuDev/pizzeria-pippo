export interface Employee {
  id: string;
  branch_id: string;
  full_name: string;
  position: string;
  is_active: boolean;
  created_at: string;
}

export interface EmployeeCredential {
  token: string;
  manual_code: string;
  qr_image_data_url: string;
}

export interface CreateEmployeeResult {
  employee: Employee;
  credential: EmployeeCredential;
}

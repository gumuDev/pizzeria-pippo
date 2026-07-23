export interface Branch {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  created_at: string;
  is_active: boolean;
  // Horario de entrada esperado (ej. "08:00") — solo informativo, se
  // muestra junto al historial de asistencia, no marca tardanzas.
  expected_start_time: string | null;
}

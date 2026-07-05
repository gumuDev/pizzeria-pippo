export interface AuthAdminUser {
  id: string;
  email: string | null;
  user_metadata: Record<string, unknown>;
  banned_until: string | null;
  created_at: string;
}

export const AUTH_ADMIN_PORT = Symbol('AUTH_ADMIN_PORT');

// Abstrae la gestión de usuarios (crear/banear/borrar/listar) detrás de una
// interfaz para no acoplar el resto del código al proveedor de auth concreto.
// Ver deuda técnica documentada en el plan de Fase 3: la verificación del JWT
// de login sigue acoplada a Supabase, esto solo cubre la gestión de usuarios.
export interface AuthAdminPort {
  listUsers(): Promise<AuthAdminUser[]>;
  createUser(input: { email: string; password: string; metadata: Record<string, unknown> }): Promise<AuthAdminUser>;
  updateUserMetadata(id: string, metadata: Record<string, unknown>): Promise<void>;
  setBanned(id: string, banned: boolean): Promise<void>;
  deleteUser(id: string): Promise<void>;
}

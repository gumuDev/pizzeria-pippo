export class AppError extends Error {
  constructor(
    public readonly message: string,
    public readonly statusCode: number,
    public readonly code: string
  ) {
    super(message);
    this.name = "AppError";
  }
  toJSON() {
    return { error: this.message, code: this.code };
  }
}

export class AuthError extends AppError {
  constructor(message = "No autenticado") { super(message, 401, "UNAUTHORIZED"); }
}
export class ForbiddenError extends AppError {
  constructor(message = "Acceso denegado") { super(message, 403, "FORBIDDEN"); }
}
export class NotFoundError extends AppError {
  constructor(message = "Recurso no encontrado") { super(message, 404, "NOT_FOUND"); }
}
export class ValidationError extends AppError {
  constructor(message: string) { super(message, 400, "VALIDATION_ERROR"); }
}
export class ConflictError extends AppError {
  constructor(message: string) { super(message, 409, "CONFLICT"); }
}

// Standard result type for client-side services
export type ServiceResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export const ok = <T>(data: T): ServiceResult<T> => ({ ok: true, data });
export const fail = (error: string): ServiceResult<never> => ({ ok: false, error });

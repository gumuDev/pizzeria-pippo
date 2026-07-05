import { HttpException, Injectable } from '@nestjs/common';
import type { AuthAdminPort, AuthAdminUser } from './auth-admin.port';

// Implementación concreta de AuthAdminPort: llama directo a la Admin API de
// Supabase Auth (GoTrue) por HTTP, sin el SDK @supabase/supabase-js.
@Injectable()
export class SupabaseAuthAdminService implements AuthAdminPort {
  private readonly baseUrl = `${process.env.SUPABASE_URL}/auth/v1/admin/users`;

  private get headers(): Record<string, string> {
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
    return {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    };
  }

  async listUsers(): Promise<AuthAdminUser[]> {
    const res = await fetch(this.baseUrl, { headers: this.headers });
    const body = await this.parse(res);
    return body.users ?? [];
  }

  async createUser(input: { email: string; password: string; metadata: Record<string, unknown> }): Promise<AuthAdminUser> {
    const res = await fetch(this.baseUrl, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({
        email: input.email,
        password: input.password,
        email_confirm: true,
        user_metadata: input.metadata,
      }),
    });
    return this.parse(res);
  }

  async updateUserMetadata(id: string, metadata: Record<string, unknown>): Promise<void> {
    const res = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      headers: this.headers,
      body: JSON.stringify({ user_metadata: metadata }),
    });
    await this.parse(res);
  }

  async setBanned(id: string, banned: boolean): Promise<void> {
    const res = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      headers: this.headers,
      body: JSON.stringify({ ban_duration: banned ? '876600h' : 'none' }),
    });
    await this.parse(res);
  }

  async deleteUser(id: string): Promise<void> {
    const res = await fetch(`${this.baseUrl}/${id}`, { method: 'DELETE', headers: this.headers });
    if (!res.ok) await this.parse(res);
  }

  private async parse(res: Response): Promise<any> {
    const text = await res.text();
    const body = text ? JSON.parse(text) : {};
    if (!res.ok) {
      const message = body.message ?? body.msg ?? body.error_description ?? body.error ?? 'Error de autenticación';
      throw new HttpException(message, res.status);
    }
    return body;
  }
}

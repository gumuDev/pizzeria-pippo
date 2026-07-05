import { HttpException } from '@nestjs/common';
import { SupabaseAuthAdminService } from './supabase-auth-admin.service';

describe('SupabaseAuthAdminService', () => {
  const originalEnv = process.env;
  let service: SupabaseAuthAdminService;
  let fetchMock: jest.Mock;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      SUPABASE_URL: 'http://localhost:54321',
      SUPABASE_SERVICE_ROLE_KEY: 'test-key',
    };
    fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
    service = new SupabaseAuthAdminService();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('listUsers pega al endpoint admin/users con el service role key y devuelve el array', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ users: [{ id: 'u1' }] }),
    });

    const result = await service.listUsers();

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:54321/auth/v1/admin/users',
      expect.objectContaining({ headers: expect.objectContaining({ apikey: 'test-key' }) }),
    );
    expect(result).toEqual([{ id: 'u1' }]);
  });

  it('createUser lanza HttpException con el status real si GoTrue responde error', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 422,
      text: async () => JSON.stringify({ msg: 'Email ya registrado' }),
    });

    await expect(
      service.createUser({ email: 'a@a.com', password: '123456', metadata: {} }),
    ).rejects.toThrow(HttpException);
  });

  it('deleteUser no lanza si la respuesta es ok', async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 200, text: async () => '' });

    await expect(service.deleteUser('u1')).resolves.toBeUndefined();
  });
});

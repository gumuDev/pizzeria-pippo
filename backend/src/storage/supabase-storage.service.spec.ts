import { HttpException } from '@nestjs/common';
import { SupabaseStorageService } from './supabase-storage.service';

describe('SupabaseStorageService', () => {
  const originalEnv = process.env;
  let service: SupabaseStorageService;
  let fetchMock: jest.Mock;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      SUPABASE_URL: 'http://localhost:54321',
      SUPABASE_SERVICE_ROLE_KEY: 'test-key',
    };
    fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
    service = new SupabaseStorageService();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('sube el archivo al bucket product-images con el service role key y devuelve la URL pública', async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 200 });

    const result = await service.uploadProductImage({
      buffer: Buffer.from('fake-image'),
      originalName: 'pizza.png',
      mimeType: 'image/png',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/^http:\/\/localhost:54321\/storage\/v1\/object\/product-images\/\d+\.png$/),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          apikey: 'test-key',
          Authorization: 'Bearer test-key',
          'Content-Type': 'image/png',
          'x-upsert': 'true',
        }),
      }),
    );
    expect(result.url).toMatch(/^http:\/\/localhost:54321\/storage\/v1\/object\/public\/product-images\/\d+\.png$/);
  });

  it('lanza HttpException con el status real si Supabase Storage responde error', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 413, text: async () => 'Payload too large' });

    await expect(
      service.uploadProductImage({ buffer: Buffer.from('x'), originalName: 'a.png', mimeType: 'image/png' }),
    ).rejects.toThrow(HttpException);
  });
});

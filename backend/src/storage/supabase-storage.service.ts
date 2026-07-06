import { HttpException, Injectable } from '@nestjs/common';
import type { StoragePort, StorageUploadFile } from './storage.port';

const PRODUCT_IMAGES_BUCKET = 'product-images';

// Concrete implementation of StoragePort: calls Supabase's Storage REST API
// directly with the service role key, without the @supabase/supabase-js SDK
// (same discipline as SupabaseAuthAdminService for Users). Swapping to a
// different S3-compatible provider later only means writing a new adapter.
@Injectable()
export class SupabaseStorageService implements StoragePort {
  private readonly baseUrl = `${process.env.SUPABASE_URL}/storage/v1`;

  private get headers(): Record<string, string> {
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
    return { apikey: key, Authorization: `Bearer ${key}` };
  }

  async uploadProductImage(file: StorageUploadFile): Promise<{ url: string }> {
    const ext = file.originalName.split('.').pop();
    const fileName = `${Date.now()}.${ext}`;

    const res = await fetch(`${this.baseUrl}/object/${PRODUCT_IMAGES_BUCKET}/${fileName}`, {
      method: 'POST',
      headers: {
        ...this.headers,
        'Content-Type': file.mimeType,
        'x-upsert': 'true',
      },
      // Node's fetch (undici) accepts a Buffer body at runtime; the DOM lib
      // types just don't model Buffer as a valid BodyInit.
      body: file.buffer as unknown as BodyInit,
    });

    if (!res.ok) {
      const body = await res.text();
      throw new HttpException(body || 'Error al subir la imagen', res.status);
    }

    return { url: `${process.env.SUPABASE_URL}/storage/v1/object/public/${PRODUCT_IMAGES_BUCKET}/${fileName}` };
  }
}

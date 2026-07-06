export const STORAGE_PORT = Symbol('STORAGE_PORT');

export interface StorageUploadFile {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
}

export interface StoragePort {
  uploadProductImage(file: StorageUploadFile): Promise<{ url: string }>;
}

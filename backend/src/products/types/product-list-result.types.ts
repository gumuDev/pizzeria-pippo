import type { Product } from '@pippo/shared';

export interface ProductListResult {
  data: Product[];
  total: number;
  page: number;
  pageSize: number;
}

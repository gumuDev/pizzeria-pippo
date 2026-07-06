export interface BranchPricesResult {
  variants: {
    id: string;
    name: string;
    base_price: number;
    branch_prices: {
      id: string;
      branch_id: string;
      price: number;
      branches: { id: string; name: string };
    }[];
  }[];
  branches: { id: string; name: string }[];
}

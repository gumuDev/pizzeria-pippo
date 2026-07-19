export interface PublicPizza {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  sizes: string[];
}

export interface PublicBranch {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
}

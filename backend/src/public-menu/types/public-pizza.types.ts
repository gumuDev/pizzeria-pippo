export interface PublicPizza {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  sizes: string[];
}

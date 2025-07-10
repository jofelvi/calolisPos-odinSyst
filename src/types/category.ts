export interface Category {
  id: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  createdAt: Date | null;
  updatedAt?: Date | null;
  imageUrl?: string | null;
  isForSale: boolean;
}

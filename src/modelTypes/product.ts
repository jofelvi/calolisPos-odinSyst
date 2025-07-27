import { CurrencyEnum, ProductTypeEnum } from '@/modelTypes/enumShared';

export interface Product {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  currency: CurrencyEnum;
  type: ProductTypeEnum;
  categoryId: string;
  supplierIds?: (string | undefined)[] | null;
  createdAt?: Date | null;
  isActive: boolean;
  isForSale: boolean;
  cost?: number; // Removemos null para compatibilidad
  category?: string;
  sku?: string | null;
  barcode?: string | null;
  stock: number;
  minStock?: number | null;
  presentation?: string | null;
  presentationQuantity?: number | null;
  updatedAt?: Date | null;
  imageUrl?: string | null;
  ingredients?: Ingredient[] | null;
}

export interface Ingredient {
  productId: string;
  quantity: number;
  unit: string;
  wastePercentage: number; // Nuevo campo
}

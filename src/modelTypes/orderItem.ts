export interface OrderItem {
  productId: string;
  name: string; // Duplicado para historial
  quantity: number;
  unitPrice: number;
  total: number;
  notes?: string | null;
}

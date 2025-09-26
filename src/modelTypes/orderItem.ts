export interface OrderItem {
  productId: string;
  name: string; // Duplicado para historial
  quantity: number;
  unitPrice: number;
  total: number;
  notes?: string | null;
  customizations?: ProductCustomization | null;
}

export interface ProductCustomization {
  removedIngredients: string[]; // IDs de ingredientes removidos
  addedExtras: AddedExtra[]; // Adicionales agregados
  customizationPrice: number; // Precio adicional por personalizaciones
}

export interface AddedExtra {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

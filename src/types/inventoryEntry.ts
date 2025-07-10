import { InventoryEntryItem } from '@/types/inventoryEntryItem';

export interface InventoryEntry {
  id: string;
  purchaseOrderId: string; // 🔗 relación con PurchaseOrder
  receivedByUserId: string; // 🔗 usuario que hizo el ingreso
  receivedAt: Date;
  items: InventoryEntryItem[];
}

import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import {
  InventoryUpdate,
  MerchandiseReceipt,
  PriceVarianceReport,
  ReceivedItem,
} from '../types/merchandiseReceiptTypes';
import { PurchaseOrderStatusEnum } from '@/shared/types/enumShared';
import { db } from '@/services/firebase/firebase';

export const createMerchandiseReceipt = async (
  receiptData: Omit<MerchandiseReceipt, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'merchandiseReceipts'), {
      ...receiptData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating merchandise receipt:', error);
    throw error;
  }
};

export const updateInventoryFromReceipt = async (
  items: ReceivedItem[],
  receiptId: string,
): Promise<InventoryUpdate[]> => {
  const batch = writeBatch(db);
  const inventoryUpdates: InventoryUpdate[] = [];

  try {
    for (const item of items) {
      // Obtener el producto actual
      const productRef = doc(db, 'products', item.productId);
      const productSnap = await getDoc(productRef);

      if (productSnap.exists()) {
        const productData = productSnap.data();
        const previousStock = productData.stock || 0;
        const previousUnitCost = productData.unitCost || 0;
        const newStock = previousStock + item.receivedQuantity;

        // Calcular nuevo costo promedio ponderado
        const totalPreviousValue = previousStock * previousUnitCost;
        const totalNewValue = item.receivedQuantity * item.receivedUnitPrice;
        const newUnitCost =
          newStock > 0
            ? (totalPreviousValue + totalNewValue) / newStock
            : item.receivedUnitPrice;

        const costVariance = newUnitCost - previousUnitCost;

        // Actualizar el producto
        batch.update(productRef, {
          stock: newStock,
          unitCost: newUnitCost,
          lastReceivedAt: Timestamp.now(),
          lastReceiptId: receiptId,
          updatedAt: Timestamp.now(),
        });

        inventoryUpdates.push({
          productId: item.productId,
          previousStock,
          addedQuantity: item.receivedQuantity,
          newStock,
          unitCost: newUnitCost,
          previousUnitCost,
          costVariance,
          updatedAt: new Date(),
        });
      }
    }

    await batch.commit();
    return inventoryUpdates;
  } catch (error) {
    console.error('Error updating inventory:', error);
    throw error;
  }
};

export const updatePurchaseOrderStatus = async (
  purchaseOrderId: string,
  items: ReceivedItem[],
): Promise<void> => {
  try {
    const orderRef = doc(db, 'purchaseOrders', purchaseOrderId);

    // Verificar si todas las cantidades fueron recibidas
    const isCompleteDelivery = items.every(
      (item) => item.receivedQuantity >= item.orderedQuantity,
    );

    const hasPartialDelivery = items.some(
      (item) =>
        item.receivedQuantity > 0 &&
        item.receivedQuantity < item.orderedQuantity,
    );

    let newStatus: PurchaseOrderStatusEnum;
    if (isCompleteDelivery) {
      newStatus = PurchaseOrderStatusEnum.RECEIVED;
    } else if (hasPartialDelivery) {
      newStatus = PurchaseOrderStatusEnum.PARTIALLY_RECEIVED;
    } else {
      newStatus = PurchaseOrderStatusEnum.APPROVED; // Mantener estado actual
    }

    await updateDoc(orderRef, {
      status: newStatus,
      receivedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error updating purchase order status:', error);
    throw error;
  }
};

export const calculatePriceVariances = (
  items: ReceivedItem[],
): PriceVarianceReport[] => {
  return items.map((item) => {
    const variance = item.receivedUnitPrice - item.orderedUnitPrice;
    const variancePercentage =
      item.orderedUnitPrice > 0 ? (variance / item.orderedUnitPrice) * 100 : 0;

    let impact: 'positive' | 'negative' | 'neutral';
    if (variance > 0) {
      impact = 'negative'; // Precio más alto es negativo para costos
    } else if (variance < 0) {
      impact = 'positive'; // Precio más bajo es positivo para costos
    } else {
      impact = 'neutral';
    }

    return {
      productId: item.productId,
      productName: item.productName,
      orderedPrice: item.orderedUnitPrice,
      receivedPrice: item.receivedUnitPrice,
      variance,
      variancePercentage,
      impact,
    };
  });
};

export const getMerchandiseReceiptsByPurchaseOrder = async (
  purchaseOrderId: string,
): Promise<MerchandiseReceipt[]> => {
  try {
    const q = query(
      collection(db, 'merchandiseReceipts'),
      where('purchaseOrderId', '==', purchaseOrderId),
      orderBy('createdAt', 'desc'),
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      receivedAt: doc.data().receivedAt?.toDate() || new Date(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate(),
    })) as MerchandiseReceipt[];
  } catch (error) {
    console.error('Error getting merchandise receipts:', error);
    throw error;
  }
};

export const getAllMerchandiseReceipts = async (): Promise<
  MerchandiseReceipt[]
> => {
  try {
    const q = query(
      collection(db, 'merchandiseReceipts'),
      orderBy('createdAt', 'desc'),
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      receivedAt: doc.data().receivedAt?.toDate() || new Date(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate(),
    })) as MerchandiseReceipt[];
  } catch (error) {
    console.error('Error getting all merchandise receipts:', error);
    throw error;
  }
};

export const merchandiseReceiptService = {
  create: createMerchandiseReceipt,
  updateInventory: updateInventoryFromReceipt,
  updatePurchaseOrderStatus,
  calculatePriceVariances,
  getByPurchaseOrder: getMerchandiseReceiptsByPurchaseOrder,
  getAll: getAllMerchandiseReceipts,
};

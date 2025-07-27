import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/services/firebase/firebase';
import { PurchaseOrder } from '@/modelTypes/purchaseOrder';

export const getPurchaseOrdersBySupplier = async (
  supplierId: string,
): Promise<PurchaseOrder[]> => {
  const q = query(
    collection(db, 'purchaseOrders'),
    where('supplierId', '==', supplierId),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() }) as PurchaseOrder,
  );
};

export const getPurchaseOrdersByStatus = async (
  status: string,
): Promise<PurchaseOrder[]> => {
  const q = query(
    collection(db, 'purchaseOrders'),
    where('status', '==', status),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() }) as PurchaseOrder,
  );
};

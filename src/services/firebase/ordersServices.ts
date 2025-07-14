import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from './firebase';
import { OrderStatusEnum } from '@/types/enumShared';
import { Order } from '@/types/order';

export const getActiveOrders = async (): Promise<Order[]> => {
  const q = query(
    collection(db, 'orders'),
    where('status', 'not-in', ['DELIVERED', 'CANCELLED', 'PAID']),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() }) as unknown as Order,
  );
};

export const getOrdersByTable = async (tableId: string): Promise<Order[]> => {
  const q = query(collection(db, 'orders'), where('tableId', '==', tableId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() }) as unknown as Order,
  );
};

export const getOrdersByStatus = async (
  status: OrderStatusEnum,
): Promise<Order[]> => {
  const q = query(collection(db, 'orders'), where('status', '==', status));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() }) as unknown as Order,
  );
};

import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from './firebase';
import { Table } from '@/modelTypes/table';
import { TableStatusEnum } from '@/modelTypes/enumShared';

export const getAvailableTables = async (): Promise<Table[]> => {
  const q = query(collection(db, 'tables'), where('isAvailable', '==', true));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Table);
};

export const getTablesByStatus = async (
  status: TableStatusEnum,
): Promise<Table[]> => {
  const q = query(collection(db, 'tables'), where('status', '==', status));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Table);
};

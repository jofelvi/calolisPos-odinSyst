import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/services/firebase/firebase';
import { User } from '@/modelTypes/user';

export const getUserByEmail = async (email: string): Promise<User | null> => {
  const q = query(collection(db, 'users'), where('email', '==', email));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as User;
};

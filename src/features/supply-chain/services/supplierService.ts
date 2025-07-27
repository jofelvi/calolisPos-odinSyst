import { Supplier } from '@/modelTypes/supplier';
import {
  collection,
  doc,
  getDocs,
  query,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/services/firebase/firebase';
import { Product } from '@/modelTypes/product';

export const getActiveSuppliers = async (): Promise<Supplier[]> => {
  const q = query(collection(db, 'suppliers'), where('isActive', '==', true));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() }) as Supplier,
  );
};

export const getSuppliersByProduct = async (
  productId: string,
): Promise<Supplier[]> => {
  const q = query(
    collection(db, 'suppliers'),
    where('productIds', 'array-contains', productId),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() }) as Supplier,
  );
};

// Métodos adicionales para productos
export const getProductsBySupplier = async (
  supplierId: string,
): Promise<Product[]> => {
  const q = query(
    collection(db, 'products'),
    where('supplierIds', 'array-contains', supplierId),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Product);
};

// Actualizar productos cuando se elimina un proveedor
export const handleSupplierDeletion = async (supplierId: string) => {
  // Obtener todos los productos que proveía este proveedor
  const products = await getProductsBySupplier(supplierId);

  // Actualizar cada producto para eliminar este proveedor
  const batch = writeBatch(db);
  products.forEach((product) => {
    const updatedSupplierIds =
      product.supplierIds?.filter((id) => id !== supplierId) || [];
    const productRef = doc(db, 'products', product.id);
    batch.update(productRef, { supplierIds: updatedSupplierIds });
  });

  await batch.commit();
};

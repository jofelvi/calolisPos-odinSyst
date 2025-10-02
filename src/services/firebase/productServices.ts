import {
  collection,
  doc,
  getDocs,
  query,
  where,
  writeBatch,
} from 'firebase/firestore';
import { Product } from '@/modelTypes/product';
import { db } from '@/services/firebase/firebase';
import { supplierService } from '@/services/firebase/genericServices';
import { getSuppliersByProduct } from '@/services/firebase/supplierServices';

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

export const getActiveProducts = async (): Promise<Product[]> => {
  const q = query(collection(db, 'products'), where('isActive', '==', true));
  const snapshot = await getDocs(q);
  const products = snapshot.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() }) as Product,
  );

  // Ordenar por nivel (menor nivel = mayor prioridad)
  return products.sort((a, b) => {
    const nivelA = a.nivel ?? 999;
    const nivelB = b.nivel ?? 999;
    return nivelA - nivelB;
  });
};

export const handleProductDeletion = async (productId: string) => {
  // Obtener todos los proveedores que tenían este producto
  const suppliers = await getSuppliersByProduct(productId);

  // Actualizar cada proveedor para eliminar este producto
  const batch = writeBatch(db);
  suppliers.forEach((supplier) => {
    const updatedProductIds =
      supplier.productIds?.filter((id) => id !== productId) || [];
    const supplierRef = doc(db, 'suppliers', supplier.id);
    batch.update(supplierRef, { productIds: updatedProductIds });
  });

  await batch.commit();
};

// Función para agregar un producto a un proveedor
export const addProductToSupplier = async (
  supplierId: string,
  productId: string,
) => {
  const supplier = await supplierService.getById(supplierId);
  if (!supplier) return;

  const updatedProductIds = [...(supplier.productIds || []), productId];
  await supplierService.update(supplierId, { productIds: updatedProductIds });
};

// Función para quitar un producto de un proveedor
export const removeProductFromSupplier = async (
  supplierId: string,
  productId: string,
) => {
  const supplier = await supplierService.getById(supplierId);
  if (!supplier) return;

  const updatedProductIds =
    supplier.productIds?.filter((id) => id !== productId) || [];
  await supplierService.update(supplierId, { productIds: updatedProductIds });
};

export const getProductsByCategory = async (
  categoryId: string,
): Promise<Product[]> => {
  try {
    const q = query(
      collection(db, 'products'),
      where('categoryId', '==', categoryId),
    );
    const querySnapshot = await getDocs(q);
    const products = querySnapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() }) as Product,
    );

    // Ordenar por nivel (menor nivel = mayor prioridad)
    return products.sort((a, b) => {
      const nivelA = a.nivel ?? 999;
      const nivelB = b.nivel ?? 999;
      return nivelA - nivelB;
    });
  } catch {
    // Handle error silently and return empty array
    // In production, you might want to log to a service or show user notification
    return [];
  }
};

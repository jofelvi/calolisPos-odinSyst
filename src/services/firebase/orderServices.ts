import { doc, getDoc, Timestamp, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import { OrderStatusEnum } from '@/shared/types/enumShared';
import { Order } from '@/modelTypes/order';
import { convertFirebaseDate } from '@/shared/utils/dateHelpers';

/**
 * Service específico para operaciones de órdenes que no están en el servicio genérico
 */
export class OrderService {
  private collectionName = 'orders';

  /**
   * Actualiza solo el estado de una orden
   * @param orderId ID de la orden
   * @param newStatus Nuevo estado de la orden
   */
  async updateOrderStatus(
    orderId: string,
    newStatus: OrderStatusEnum,
  ): Promise<void> {
    try {
      const orderRef = doc(db, this.collectionName, orderId);

      await updateDoc(orderRef, {
        status: newStatus,
        updatedAt: Timestamp.now(),
      });
    } catch {
      throw new Error('Failed to update order status');
    }
  }

  /**
   * Obtiene una orden por ID
   * @param orderId ID de la orden
   * @returns Orden o null si no existe
   */
  async getById(orderId: string): Promise<Order | null> {
    try {
      const orderRef = doc(db, this.collectionName, orderId);
      const orderSnap = await getDoc(orderRef);

      if (!orderSnap.exists()) {
        return null;
      }

      const data = orderSnap.data();
      return {
        id: orderSnap.id,
        ...data,
        createdAt: convertFirebaseDate(data.createdAt),
        updatedAt: convertFirebaseDate(data.updatedAt),
      } as Order;
    } catch {
      throw new Error('Failed to get order');
    }
  }

  /**
   * Actualiza múltiples campos de estado de una orden
   * @param orderId ID de la orden
   * @param updates Campos a actualizar
   */
  async updateOrderFields(
    orderId: string,
    updates: {
      status?: OrderStatusEnum;
      paymentStatus?: string;
      paymentMethod?: string;
      notes?: string;
      tableId?: string;
    },
  ): Promise<void> {
    try {
      const orderRef = doc(db, this.collectionName, orderId);

      await updateDoc(orderRef, {
        ...updates,
        updatedAt: Timestamp.now(),
      });
    } catch {
      throw new Error('Failed to update order fields');
    }
  }
}

// Exportar una instancia del servicio
export const orderSpecificService = new OrderService();

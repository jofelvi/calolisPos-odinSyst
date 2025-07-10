import { useEffect, useState } from 'react';
import { PurchaseOrder } from '@/types/purchaseOrder';
import { purchaseOrderService } from '@/services/firebase/genericServices';

export function useOrdersPurchased() {
  const [ordersPurchased, setOrdersPurchased] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedOrders = await purchaseOrderService.getAll();
      setOrdersPurchased(fetchedOrders);
    } catch (err) {
      setError('Error al cargar las órdenes');
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchOrders();
  }, []);

  const refetch = () => {
    void fetchOrders();
  };

  return {
    ordersPurchased,
    loading,
    error,
    refetch,
  };
}

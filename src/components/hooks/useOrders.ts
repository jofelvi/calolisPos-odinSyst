import { useEffect, useState } from 'react';
import { PurchaseOrder } from '@/types/purchaseOrder';
import { purchaseOrderService } from '@/services/firebase/genericServices';

export function useOrders() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedOrders = await purchaseOrderService.getAll();
      setOrders(fetchedOrders);
    } catch {
      setError('Error al cargar las órdenes');
      // Error fetching orders - handled by error state
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const refetch = () => {
    fetchOrders();
  };

  return {
    orders,
    loading,
    error,
    refetch,
  };
}

'use client';
import OrderGrid from '@/app/components/purchaseOrders/OrderGrid';
import { useOrders } from '@/components/hooks/useOrders';
import { OrderGridSkeleton } from '@/app/components/purchaseOrders/order-skeleton';

export function OrderList() {
  const { orders, loading, error, refetch } = useOrders();

  if (loading) {
    return <OrderGridSkeleton />;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 mb-4">{error}</div>
        <button
          onClick={refetch}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return <OrderGrid orders={orders} />;
}

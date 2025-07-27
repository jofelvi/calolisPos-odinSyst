// app/pos/receipt/[orderId]/page.tsx
'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Payment } from '@/modelTypes/payment';
import {
  orderService,
  paymentService,
} from '@/services/firebase/genericServices';
import { Order } from '@/modelTypes/order';
import { Button } from '@/components/shared/button/Button';
import Receipt from '@/features/pos/Receipt';
import { formatDateForDisplay } from '@/shared/utils/serializeTimestamp';

interface PageProps {
  params: Promise<{ orderId: string }>;
}

export default function ReceiptPage({ params }: PageProps) {
  const { orderId } = use(params);
  const router = useRouter();
  const [orderState, setOrderState] = useState<Order | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [orderData, paymentData] = await Promise.all([
          orderService.getById(orderId),
          paymentService.getAll(),
        ]);

        if (!orderData) {
          router.push('/pos');
          return;
        }

        setOrderState(orderData);

        // Filtrar pagos de esta orden
        const orderPayments = paymentData.filter((p) => p.orderId === orderId);
        setPayments(orderPayments);
      } catch {
        // Handle error silently - component will show loading state
        // In a production app, you might want to show an error toast or redirect
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [orderId, router]);

  const handlePrint = () => {
    window.print();
  };

  const handleNewOrder = () => {
    router.push('/pos');
  };

  if (loading || !orderState) {
    return <div>Loading receipt data...</div>;
  }

  const order: Order = {
    ...orderState,
    createdAt: new Date(formatDateForDisplay(orderState.createdAt)),
    updatedAt: new Date(formatDateForDisplay(orderState.updatedAt)),
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          Recibo de Orden #{orderId.slice(0, 6)}
        </h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint}>
            Imprimir Recibo
          </Button>
          <Button onClick={handleNewOrder}>Nueva Orden</Button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        <Receipt order={order} payments={payments} />
      </div>
    </div>
  );
}

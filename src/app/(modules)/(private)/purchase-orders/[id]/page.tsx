import { notFound } from 'next/navigation';
import { purchaseOrderService } from '@/services/firebase/genericServices';
import PurchaseOrderForm from '@/app/components/purchaseOrders/PurchaseOrderForm';
import { formatDateForDisplay } from '@/utils/serializeTimestamp';

interface PageProps {
  params: { id: string };
}

export default async function EditPurchaseOrderPage({ params }: PageProps) {
  const orderData = await purchaseOrderService.getById(params.id);
  if (!orderData) return notFound();

  const order = {
    ...orderData,
    createdAt: new Date(formatDateForDisplay(orderData.createdAt)),
    expectedDeliveryDate: new Date(
      formatDateForDisplay(orderData.expectedDeliveryDate),
    ),
  };
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Editar Orden de Compra</h1>
      <div className="bg-white shadow rounded-lg p-6">
        <PurchaseOrderForm initialData={order} />
      </div>
    </div>
  );
}

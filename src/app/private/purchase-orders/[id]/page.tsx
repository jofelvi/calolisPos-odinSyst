import { notFound } from 'next/navigation';
import { purchaseOrderService } from '@/services/firebase/genericServices';
import PurchaseOrderForm from '@/features/purchaseOrders/PurchaseOrderForm';
import { formatDateForDisplay } from '@/shared/utils/serializeTimestamp';
import BackIcon from '@/components/shared/BackButton/BackButton';
import { PRIVATE_ROUTES } from '@/constants/routes';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPurchaseOrderPage({ params }: PageProps) {
  const { id } = await params;
  const orderData = await purchaseOrderService.getById(id);
  if (!orderData) return notFound();

  const order = {
    ...orderData,
    createdAt: new Date(formatDateForDisplay(orderData.createdAt)),
    expectedDeliveryDate: new Date(
      formatDateForDisplay(orderData.expectedDeliveryDate),
    ),
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-teal-50 to-blue-50">
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <BackIcon
            href={PRIVATE_ROUTES.PURCHASE_ORDERS_DETAILS(id)}
            tooltip="Volver a Detalles"
          />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-700 to-teal-600 bg-clip-text text-transparent mt-4">
            Editar Orden de Compra
          </h1>
          <p className="text-cyan-600/80 mt-1">
            Modifica los datos de la orden #{order.id.slice(0, 8)}
          </p>
        </div>
        <div className="bg-white/90 backdrop-blur-sm shadow-xl rounded-2xl p-8 border border-cyan-100/50">
          <PurchaseOrderForm initialData={order} />
        </div>
      </div>
    </div>
  );
}

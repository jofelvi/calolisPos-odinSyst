import PurchaseOrderForm from '@/app/components/purchaseOrders/PurchaseOrderForm';

export default function NewPurchaseOrderPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Nueva Orden de Compra</h1>
      <div className="bg-white shadow rounded-lg p-6">
        <PurchaseOrderForm isNew />
      </div>
    </div>
  );
}

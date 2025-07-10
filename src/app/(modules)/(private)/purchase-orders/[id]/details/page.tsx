import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  purchaseOrderService,
  supplierService,
} from '@/services/firebase/genericServices';
import { getStatusVariantPurchaseOrder } from '@/utils/getStatusVariantPurchaseOrder';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/shared/card/card';
import { Badge } from '@/components/shared/badge/badge';
import { formatDateForDisplay } from '@/utils/serializeTimestamp';

export default async function PurchaseOrderDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const orderData = await purchaseOrderService.getById(params.id);
  if (!orderData) return notFound();

  const supplier = await supplierService.getById(orderData.supplierId);

  const order = {
    ...orderData,
    createdAt: formatDateForDisplay(orderData.createdAt),
    expectedDeliveryDate: formatDateForDisplay(orderData.expectedDeliveryDate),
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Detalle de Orden de Compra</h1>
        <div className="flex space-x-2">
          <Link href={`/purchase-orders/${order.id}/edit`}>
            <button className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300">
              Editar
            </button>
          </Link>
          <Link href="/purchase-orders">
            <button className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700">
              Volver
            </button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Orden #{order.id.slice(0, 8)}</span>
            <Badge variant={getStatusVariantPurchaseOrder(order.status)}>
              {order.status}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-500">Proveedor</p>
              <p className="font-medium">
                {supplier?.name || order.supplierId}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total</p>
              <p className="font-medium">
                {order.currency} {order.totalAmount.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Fecha de Creación</p>
              <p className="font-medium">{order.createdAt || 'N/A'}</p>
            </div>
          </div>

          {order.expectedDeliveryDate && (
            <div>
              <p className="text-sm text-gray-500">Fecha Esperada de Entrega</p>
              <p className="font-medium">
                {new Date(order.expectedDeliveryDate).toLocaleDateString()}
              </p>
            </div>
          )}

          {order.receivedAt && (
            <div>
              <p className="text-sm text-gray-500">Fecha de Recepción</p>
              <p className="font-medium">
                {new Date(order.receivedAt).toLocaleDateString()}
              </p>
            </div>
          )}

          <div className="mt-6">
            <h3 className="text-lg font-medium mb-2">Items</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Producto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cantidad
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Costo Unitario
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subtotal
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {order.items.map((item, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {item.productName || item.productId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {item.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {order.currency} {item.unitCost.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {order.currency} {item.subtotal.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

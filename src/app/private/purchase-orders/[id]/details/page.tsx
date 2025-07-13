import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  purchaseOrderService,
  supplierService,
  productService,
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
import { PRIVATE_ROUTES } from '@/constants/routes';
import { Button } from '@/components/shared/button/Button';
import { ArrowLeft, Edit } from 'lucide-react';

export default async function PurchaseOrderDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const orderData = await purchaseOrderService.getById(params.id);
  if (!orderData) return notFound();

  // Fetch supplier data
  const supplier = await supplierService.getById(orderData.supplierId);
  
  // Fetch all products to enrich items with product names
  const products = await productService.getAll();
  
  // Enrich order items with product names
  const enrichedItems = orderData.items.map(item => {
    const product = products.find(p => p.id === item.productId);
    return {
      ...item,
      productName: product?.name || 'Producto no encontrado'
    };
  });

  const order = {
    ...orderData,
    items: enrichedItems,
    createdAt: formatDateForDisplay(orderData.createdAt),
    expectedDeliveryDate: formatDateForDisplay(orderData.expectedDeliveryDate),
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-teal-50 to-blue-50">
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-700 to-teal-600 bg-clip-text text-transparent">Detalle de Orden de Compra</h1>
            <p className="text-cyan-600/80 mt-1">Información completa de la orden #{order.id.slice(0, 8)}</p>
          </div>
          <div className="flex space-x-3">
            <Link href={PRIVATE_ROUTES.PURCHASE_ORDERS_EDIT(order.id)}>
              <Button variant="outline">
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </Button>
            </Link>
            <Link href={PRIVATE_ROUTES.PURCHASE_ORDERS}>
              <Button variant="ghost">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Button>
            </Link>
          </div>
        </div>

        <Card className="bg-white/90 backdrop-blur-sm shadow-xl border border-cyan-100/50">
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span className="text-cyan-900">Orden #{order.id.slice(0, 8)}</span>
              <Badge variant={getStatusVariantPurchaseOrder(order.status)}>
                {order.status}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-cyan-50 to-teal-50 p-4 rounded-xl border border-cyan-100">
              <p className="text-sm font-semibold text-cyan-600 mb-1">Proveedor</p>
              <p className="font-bold text-cyan-900">
                {supplier?.name || order.supplierId}
              </p>
            </div>
            <div className="bg-gradient-to-br from-teal-50 to-cyan-50 p-4 rounded-xl border border-teal-100">
              <p className="text-sm font-semibold text-teal-600 mb-1">Total</p>
              <p className="font-bold text-teal-900 text-lg">
                {order.currency} {order.totalAmount.toFixed(2)}
              </p>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-4 rounded-xl border border-blue-100">
              <p className="text-sm font-semibold text-blue-600 mb-1">Fecha de Creación</p>
              <p className="font-bold text-blue-900">{order.createdAt || 'N/A'}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {order.expectedDeliveryDate && (
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-4 rounded-xl border border-amber-100">
                <p className="text-sm font-semibold text-amber-600 mb-1">Fecha Esperada de Entrega</p>
                <p className="font-bold text-amber-900">
                  {new Date(order.expectedDeliveryDate).toLocaleDateString()}
                </p>
              </div>
            )}

            {order.receivedAt && (
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl border border-green-100">
                <p className="text-sm font-semibold text-green-600 mb-1">Fecha de Recepción</p>
                <p className="font-bold text-green-900">
                  {new Date(order.receivedAt).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>

          <div className="mt-8">
            <h3 className="text-xl font-bold text-cyan-900 mb-4">Productos de la Orden</h3>
            <div className="overflow-x-auto bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-cyan-100/50">
              <table className="min-w-full divide-y divide-cyan-200">
                <thead className="bg-gradient-to-r from-cyan-50 to-teal-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-cyan-700 uppercase tracking-wider">
                      Producto
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-cyan-700 uppercase tracking-wider">
                      Cantidad
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-cyan-700 uppercase tracking-wider">
                      Costo Unitario
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-cyan-700 uppercase tracking-wider">
                      Subtotal
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white/80 divide-y divide-cyan-100">
                  {order.items.map((item, index) => (
                    <tr key={index} className="hover:bg-cyan-50/50 transition-colors duration-200">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-semibold text-cyan-900">
                          {item.productName || 'Producto sin nombre'}
                        </div>
                        {item.productId && (
                          <div className="text-xs text-cyan-600 mt-1">
                            ID: {item.productId}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-cyan-800 font-medium">
                        {item.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-cyan-800 font-medium">
                        {order.currency} {item.unitCost.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-cyan-900 font-semibold">
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
    </div>
  );
}

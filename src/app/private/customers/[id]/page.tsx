import {
  customerService,
  getCustomerReceivables,
  orderService,
} from '@/services/firebase/genericServices';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/shared/card/card';
import { Badge } from '@/components/shared/badge/badge';
import { Button } from '@/components/shared/button/Button';
import Link from 'next/link';
import { InvoiceStatusEnum } from '@/shared';
import { notFound } from 'next/navigation';
import { OrderItem } from '@/modelTypes/orderItem';
import { PRIVATE_ROUTES } from '@/shared/constantsRoutes/routes';

interface CustomerProfilePageProps {
  params: Promise<{ id: string }>;
}

export default async function CustomerProfilePage({
  params,
}: CustomerProfilePageProps) {
  const { id } = await params;

  const customer = await customerService.getById(id);

  if (!customer) {
    notFound();
  }

  // Get customer orders, accounts receivable, and analytics
  const allOrders = await orderService.getAll();
  const customerOrders = allOrders.filter(
    (order) => order.customerId === customer.id,
  );
  const accountsReceivable = await getCustomerReceivables(customer.id);

  // Calculate analytics
  const totalSpent = customerOrders.reduce(
    (sum, order) => sum + order.total,
    0,
  );
  const totalPending = accountsReceivable.reduce(
    (sum, ar) => sum + (ar.amount - ar.paidAmount),
    0,
  );
  const orderCount = customerOrders.length;

  // Get last order
  const lastOrder =
    customerOrders.length > 0
      ? customerOrders.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )[0]
      : null;

  // Calculate favorite products
  const productCount: Record<
    string,
    { count: number; name: string; lastOrdered: Date }
  > = {};

  customerOrders.forEach((order) => {
    if (order.items) {
      order.items.forEach((item: OrderItem) => {
        if (productCount[item.productId]) {
          productCount[item.productId].count += item.quantity;
          if (
            new Date(order.createdAt) > productCount[item.productId].lastOrdered
          ) {
            productCount[item.productId].lastOrdered = new Date(
              order.createdAt,
            );
          }
        } else {
          productCount[item.productId] = {
            count: item.quantity,
            name: item.name,
            lastOrdered: new Date(order.createdAt),
          };
        }
      });
    }
  });

  const favoriteProducts = Object.entries(productCount)
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, 5);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-VE', {
      style: 'currency',
      currency: 'VES',
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('es-VE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: InvoiceStatusEnum) => {
    switch (status) {
      case InvoiceStatusEnum.PAID:
        return <Badge variant="success">Pagado</Badge>;
      case InvoiceStatusEnum.PENDING:
        return <Badge variant="destructive">Pendiente</Badge>;
      case InvoiceStatusEnum.PARTIALLY_PAID:
        return <Badge variant="warning">Parcial</Badge>;
      case InvoiceStatusEnum.OVERDUE:
        return <Badge variant="destructive">Vencido</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Perfil de {customer.name}
          </h1>
          <p className="text-gray-600">Información detallada del cliente</p>
        </div>
        <div className="flex gap-2">
          <Link href={PRIVATE_ROUTES.CUSTOMERS}>
            <Button variant="outline">Volver</Button>
          </Link>
        </div>
      </div>

      {/* Customer Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-cyan-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600">
              Total Gastado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">
              {formatCurrency(totalSpent)}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600">
              Órdenes Totales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{orderCount}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-pink-50 border-red-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600">
              Deuda Pendiente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">
              {formatCurrency(totalPending)}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600">
              Promedio por Orden
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-purple-600">
              {formatCurrency(orderCount > 0 ? totalSpent / orderCount : 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer Basic Info */}
        <div>
          <Card className="bg-white/95 backdrop-blur-sm border-cyan-100 shadow-lg mb-6">
            <CardHeader className="bg-gradient-to-r from-cyan-50 to-blue-50 border-b border-cyan-100">
              <CardTitle className="text-cyan-800">
                Información Básica
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Nombre
                </label>
                <p className="text-lg font-semibold text-gray-900">
                  {customer.name}
                </p>
              </div>

              {customer.phone && (
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Teléfono
                  </label>
                  <p className="text-gray-900">{customer.phone}</p>
                </div>
              )}

              {customer.email && (
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Email
                  </label>
                  <p className="text-gray-900">{customer.email}</p>
                </div>
              )}

              {customer.identificationType && customer.identificationId && (
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Identificación
                  </label>
                  <p className="text-gray-900">
                    {customer.identificationType}-{customer.identificationId}
                  </p>
                </div>
              )}

              {customer.address && (
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Dirección
                  </label>
                  <p className="text-gray-900">{customer.address}</p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-600">
                  Estado
                </label>
                <Badge variant={customer.isActive ? 'success' : 'destructive'}>
                  {customer.isActive ? 'Activo' : 'Inactivo'}
                </Badge>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">
                  Cliente desde
                </label>
                <p className="text-gray-900">
                  {formatDate(customer.createdAt)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Favorite Products */}
          <Card className="bg-white/95 backdrop-blur-sm border-cyan-100 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100">
              <CardTitle className="text-purple-800">
                Productos Favoritos
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {favoriteProducts.length > 0 ? (
                <div className="space-y-3">
                  {favoriteProducts.map(([productId, product], index) => (
                    <div
                      key={productId}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-gray-900">
                          {product.name}
                        </p>
                        <p className="text-sm text-gray-600">
                          Última vez: {formatDate(product.lastOrdered)}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant="secondary">#{index + 1}</Badge>
                        <p className="text-sm text-purple-600 font-medium">
                          {product.count} veces
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">
                  No hay productos ordenados aún
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Orders History and Accounts Receivable */}
        <div className="lg:col-span-2 space-y-6">
          {/* Last Order */}
          {lastOrder && (
            <Card className="bg-white/95 backdrop-blur-sm border-cyan-100 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-emerald-100">
                <CardTitle className="text-emerald-800">Última Orden</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Fecha
                    </label>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatDate(lastOrder.createdAt)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Total
                    </label>
                    <p className="text-lg font-semibold text-green-600">
                      {formatCurrency(lastOrder.total)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Estado
                    </label>
                    <p className="text-lg font-semibold text-gray-900 capitalize">
                      {lastOrder.status.replace('_', ' ')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Orders */}
          <Card className="bg-white/95 backdrop-blur-sm border-cyan-100 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-cyan-50 to-blue-50 border-b border-cyan-100">
              <CardTitle className="text-cyan-800">
                Historial de Órdenes Recientes
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {customerOrders.length > 0 ? (
                <div className="space-y-3">
                  {customerOrders
                    .sort(
                      (a, b) =>
                        new Date(b.createdAt).getTime() -
                        new Date(a.createdAt).getTime(),
                    )
                    .slice(0, 5)
                    .map((order) => (
                      <div
                        key={order.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div>
                          <p className="font-medium text-gray-900">
                            Orden #{order.id.slice(-8)}
                          </p>
                          <p className="text-sm text-gray-600">
                            {formatDate(order.createdAt)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-cyan-600">
                            {formatCurrency(order.total)}
                          </p>
                          <Badge variant="secondary" className="text-xs">
                            {order.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">
                  No hay órdenes registradas
                </p>
              )}

              {customerOrders.length > 5 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <Button variant="outline" className="w-full">
                    Ver Todas las Órdenes ({customerOrders.length})
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Accounts Receivable */}
          <Card className="bg-white/95 backdrop-blur-sm border-cyan-100 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-red-50 to-pink-50 border-b border-red-100">
              <CardTitle className="text-red-800">Cuentas por Cobrar</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {accountsReceivable.length > 0 ? (
                <div className="space-y-3">
                  {accountsReceivable.map((receivable) => (
                    <Link
                      key={receivable.id}
                      href={PRIVATE_ROUTES.ACCOUNTS_RECEIVABLE_DETAILS(
                        receivable.id,
                      )}
                      className="block"
                    >
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div>
                          <p className="font-medium text-gray-900">
                            Factura #{receivable.invoiceNumber}
                          </p>
                          <p className="text-sm text-gray-600">
                            Vence: {formatDate(receivable.dueDate)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-red-600">
                            {formatCurrency(
                              receivable.amount - receivable.paidAmount,
                            )}
                          </p>
                          {getStatusBadge(receivable.status)}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">
                  No hay cuentas pendientes
                </p>
              )}

              {accountsReceivable.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <Link
                    href={`${PRIVATE_ROUTES.ACCOUNTS_RECEIVABLE}?query=${customer.name}`}
                  >
                    <Button variant="outline" className="w-full">
                      Ver Todas las Cuentas por Cobrar
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

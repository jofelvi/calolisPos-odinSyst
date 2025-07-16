import {
  accountReceivableService,
  customerService,
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
import { InvoiceStatusEnum } from '@/types/enumShared';
import { notFound } from 'next/navigation';

interface AccountReceivableDetailsPageProps {
  params: Promise<{ id: string }>;
}

export default async function AccountReceivableDetailsPage({
  params,
}: AccountReceivableDetailsPageProps) {
  const { id } = await params;

  const accountReceivable = await accountReceivableService.getById(id);

  if (!accountReceivable) {
    notFound();
  }

  const customer = await customerService.getById(accountReceivable.customerId);

  // Get order information if orderId exists
  let order = null;
  if (accountReceivable.orderId) {
    try {
      order = await orderService.getById(accountReceivable.orderId);
    } catch {
      // Error fetching order - handled by optional order display
    }
  }

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

  const pendingAmount = accountReceivable.amount - accountReceivable.paidAmount;
  const isOverdue =
    new Date(accountReceivable.dueDate) < new Date() && pendingAmount > 0;

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Factura #{accountReceivable.invoiceNumber}
          </h1>
          <p className="text-gray-600">Detalles de la cuenta por cobrar</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/private/accounts-receivable/${id}/edit`}>
            <Button variant="outline">Editar</Button>
          </Link>
          <Link href="/private/accounts-receivable">
            <Button variant="outline">Volver</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status and Summary Cards */}
        <div className="lg:col-span-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-cyan-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-600">Estado</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  {getStatusBadge(accountReceivable.status)}
                  {isOverdue && <Badge variant="destructive">Vencido</Badge>}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-600">Total</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-gray-800">
                  {formatCurrency(accountReceivable.amount)}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-600">Pagado</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(accountReceivable.paidAmount)}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-red-50 to-pink-50 border-red-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-600">
                  Pendiente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(pendingAmount)}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Account Details */}
        <div className="lg:col-span-2">
          <Card className="bg-white/95 backdrop-blur-sm border-cyan-100 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-cyan-50 to-blue-50 border-b border-cyan-100">
              <CardTitle className="text-cyan-800">
                Detalles de la Cuenta
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Número de Factura
                  </label>
                  <p className="text-lg font-semibold text-gray-900">
                    {accountReceivable.invoiceNumber}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Fecha de Vencimiento
                  </label>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatDate(accountReceivable.dueDate)}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Fecha de Creación
                  </label>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatDate(accountReceivable.createdAt)}
                  </p>
                </div>

                {accountReceivable.updatedAt && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Última Actualización
                    </label>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatDate(accountReceivable.updatedAt)}
                    </p>
                  </div>
                )}
              </div>

              {accountReceivable.description && (
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Descripción
                  </label>
                  <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                    {accountReceivable.description}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Customer Information */}
        <div>
          <Card className="bg-white/95 backdrop-blur-sm border-cyan-100 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-cyan-50 to-blue-50 border-b border-cyan-100">
              <CardTitle className="text-cyan-800">
                Información del Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Nombre
                </label>
                <p className="text-lg font-semibold text-gray-900">
                  {accountReceivable.customerName}
                </p>
              </div>

              {customer && (
                <>
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
                        {customer.identificationType}-
                        {customer.identificationId}
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
                </>
              )}

              <div className="pt-2">
                <Link
                  href={`/private/customers/${accountReceivable.customerId}`}
                >
                  <Button variant="outline" className="w-full">
                    Ver Perfil del Cliente
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Order Information */}
      {order && (
        <Card className="mt-6 bg-white/95 backdrop-blur-sm border-cyan-100 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-purple-100">
            <CardTitle className="text-purple-800">Orden Asociada</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">
                  ID de Orden
                </label>
                <p className="text-lg font-semibold text-gray-900">
                  #{order.id}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Fecha de Orden
                </label>
                <p className="text-lg font-semibold text-gray-900">
                  {formatDate(order.createdAt)}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Total de la Orden
                </label>
                <p className="text-lg font-semibold text-purple-600">
                  {formatCurrency(order.total)}
                </p>
              </div>
              {order.tableId && (
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Mesa
                  </label>
                  <p className="text-lg font-semibold text-gray-900">
                    Mesa #{order.tableId}
                  </p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Estado de Orden
                </label>
                <p className="text-lg font-semibold text-gray-900 capitalize">
                  {order.status.replace('_', ' ')}
                </p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <Link href={`/private/orders/${order.id}`}>
                <Button variant="outline" className="w-full">
                  Ver Detalles de la Orden
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Progress */}
      <Card className="mt-6 bg-white/95 backdrop-blur-sm border-cyan-100 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-cyan-50 to-blue-50 border-b border-cyan-100">
          <CardTitle className="text-cyan-800">Progreso de Pago</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Progreso</span>
              <span className="font-medium">
                {Math.round(
                  (accountReceivable.paidAmount / accountReceivable.amount) *
                    100,
                )}
                %
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min((accountReceivable.paidAmount / accountReceivable.amount) * 100, 100)}%`,
                }}
              ></div>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>
                Pagado: {formatCurrency(accountReceivable.paidAmount)}
              </span>
              <span>Pendiente: {formatCurrency(pendingAmount)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

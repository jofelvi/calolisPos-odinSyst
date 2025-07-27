'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/shared/card/card';
import { Badge } from '@/components/shared/badge/badge';
import { formatDate, formatDateTime } from '@/shared/utils/dateHelpers';
import { PRIVATE_ROUTES } from '@/constants/routes';
import { Button } from '@/components/shared/button/Button';
import {
  ArrowLeft,
  Calendar,
  CreditCard,
  DollarSign,
  Eye,
  FileText,
  Mail,
  MapPin,
  Package,
  Phone,
  ShoppingCart,
  User,
} from 'lucide-react';
import { InvoiceStatusEnum } from '@/modelTypes/enumShared';
import {
  InvoiceDetailData,
  invoiceDetailService,
} from '@/services/firebase/invoiceDetailService';
import PDFDownloadButton from '@/features/invoices/PDFDownloadButton';
import Loader from '@/components/shared/Loader/Loader';

export default function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [invoiceDetails, setInvoiceDetails] =
    useState<InvoiceDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadInvoiceDetails = async () => {
      try {
        const details =
          await invoiceDetailService.getInvoiceWithFullDetails(id);
        if (!details) {
          router.push('/not-found');
          return;
        }

        setInvoiceDetails(details);
      } catch (error) {
        console.error('Error loading invoice details:', error);
        router.push('/not-found');
      } finally {
        setIsLoading(false);
      }
    };

    void loadInvoiceDetails();
  }, [id, router]);

  if (isLoading) {
    return <Loader text="Cargando detalles de factura..." />;
  }

  if (!invoiceDetails) {
    return <div>Factura no encontrada</div>;
  }

  const { invoice, order, customer, user, enrichedItems, payments, totalPaid } =
    invoiceDetails;
  const paymentMethodsSummary =
    invoiceDetailService.getPaymentMethodsSummary(payments);
  const isFullyPaid = invoiceDetailService.isInvoiceFullyPaid(
    invoice,
    totalPaid,
  );
  const pendingBalance = invoiceDetailService.getPendingBalance(
    invoice,
    totalPaid,
  );

  const getStatusVariant = (status: InvoiceStatusEnum) => {
    switch (status) {
      case InvoiceStatusEnum.PAID:
        return 'success';
      case InvoiceStatusEnum.PENDING:
        return 'warning';
      case InvoiceStatusEnum.OVERDUE:
        return 'destructive';
      case InvoiceStatusEnum.CANCELLED:
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: InvoiceStatusEnum) => {
    switch (status) {
      case InvoiceStatusEnum.PAID:
        return 'Pagada';
      case InvoiceStatusEnum.PENDING:
        return 'Pendiente';
      case InvoiceStatusEnum.OVERDUE:
        return 'Vencida';
      case InvoiceStatusEnum.CANCELLED:
        return 'Cancelada';
      default:
        return status;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-teal-50 to-blue-50">
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-700 to-teal-600 bg-clip-text text-transparent">
              Detalle de Factura
            </h1>
            <p className="text-cyan-600/80 mt-1">
              Factura #{invoice.invoiceNumber || invoice.id}
            </p>
          </div>
          <div className="flex space-x-3">
            <PDFDownloadButton invoice={invoice} customer={customer} />
            <Button variant="outline" onClick={() => window.print()}>
              <Eye className="w-4 h-4 mr-2" />
              Vista Previa
            </Button>
            <Link href={PRIVATE_ROUTES.INVOICES}>
              <Button variant="ghost">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Información principal */}
          <div className="lg:col-span-2">
            <Card className="bg-white/90 backdrop-blur-sm shadow-xl border border-cyan-100/50">
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span className="text-cyan-900 flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Factura #{invoice.invoiceNumber || invoice.id}
                  </span>
                  <div className="flex gap-2">
                    <Badge variant={getStatusVariant(invoice.status)}>
                      {getStatusLabel(invoice.status)}
                    </Badge>
                    {isFullyPaid ? (
                      <Badge variant="success">Pagada Completamente</Badge>
                    ) : (
                      <Badge variant="warning">
                        Pendiente: ${pendingBalance.toFixed(2)}
                      </Badge>
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Información del cliente */}
                <div className="bg-gradient-to-br from-cyan-50 to-teal-50 p-6 rounded-xl border border-cyan-100">
                  <h3 className="text-lg font-semibold text-cyan-900 mb-4">
                    Información del Cliente
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-teal-500 rounded-lg flex items-center justify-center">
                        <User className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-cyan-600 mb-1">
                          Nombre del Cliente
                        </p>
                        <p className="font-semibold text-cyan-900 text-lg">
                          {customer?.name || 'Cliente no especificado'}
                        </p>
                        {customer?.id && (
                          <p className="text-xs text-cyan-600 mt-1">
                            ID: {customer.id.slice(0, 8)}
                          </p>
                        )}
                        {user && (
                          <p className="text-xs text-cyan-500 mt-1">
                            Atendido por: {user.name}
                          </p>
                        )}
                      </div>
                    </div>

                    {customer?.email && (
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-lg flex items-center justify-center">
                          <Mail className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-cyan-600 mb-1">
                            Email
                          </p>
                          <p className="font-semibold text-cyan-900">
                            {customer.email}
                          </p>
                        </div>
                      </div>
                    )}

                    {customer?.phone && (
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-teal-500 rounded-lg flex items-center justify-center">
                          <Phone className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-cyan-600 mb-1">
                            Teléfono
                          </p>
                          <p className="font-semibold text-cyan-900">
                            {customer.phone}
                          </p>
                        </div>
                      </div>
                    )}

                    {customer?.address && (
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-cyan-500 rounded-lg flex items-center justify-center">
                          <MapPin className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-cyan-600 mb-1">
                            Dirección
                          </p>
                          <p className="font-semibold text-cyan-900">
                            {customer.address}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Items de la orden */}
                <div>
                  <h3 className="text-lg font-semibold text-cyan-900 mb-4 flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    Productos de la Orden
                  </h3>
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
                            Precio Unitario
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-cyan-700 uppercase tracking-wider">
                            Notas
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-cyan-700 uppercase tracking-wider">
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white/80 divide-y divide-cyan-100">
                        {enrichedItems.length > 0 ? (
                          enrichedItems.map((item, index) => (
                            <tr
                              key={index}
                              className="hover:bg-cyan-50/50 transition-colors duration-200"
                            >
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-teal-500 rounded-lg flex items-center justify-center">
                                    <Package className="h-4 w-4 text-white" />
                                  </div>
                                  <div>
                                    <div className="font-semibold text-cyan-900">
                                      {item.product?.name ||
                                        item.name ||
                                        'Producto no encontrado'}
                                    </div>
                                    {item.product?.sku && (
                                      <div className="text-xs text-cyan-600">
                                        SKU: {item.product.sku}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-cyan-800 font-medium text-center">
                                {item.quantity || 0}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-cyan-800 font-medium">
                                ${(item.unitPrice || 0).toFixed(2)}
                              </td>
                              <td className="px-6 py-4">
                                {item.notes ? (
                                  <div className="text-xs text-gray-600 italic">
                                    {item.notes}
                                  </div>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-cyan-900 font-semibold">
                                $
                                {(
                                  (item.quantity || 0) * (item.unitPrice || 0)
                                ).toFixed(2)}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="px-6 py-8 text-center">
                              <div className="text-cyan-600">
                                No hay productos en esta orden
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Totales */}
                <div className="bg-gradient-to-br from-teal-50 to-cyan-50 p-6 rounded-xl border border-teal-100">
                  <div className="space-y-3">
                    <div className="flex justify-between text-cyan-700">
                      <span>Subtotal</span>
                      <span className="font-semibold">
                        ${(invoice.subtotal || 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-cyan-700">
                      <span>
                        Impuestos (
                        {invoice.subtotal
                          ? ((invoice.tax / invoice.subtotal) * 100).toFixed(0)
                          : '0'}
                        %)
                      </span>
                      <span className="font-semibold">
                        ${(invoice.tax || 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="border-t border-cyan-200 pt-3">
                      <div className="flex justify-between text-xl font-bold text-cyan-900">
                        <span>Total Factura</span>
                        <span>${(invoice.total || 0).toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="border-t border-cyan-200 pt-3 mt-3">
                      <div className="flex justify-between text-lg font-semibold text-green-700">
                        <span>Total Pagado</span>
                        <span>${totalPaid.toFixed(2)}</span>
                      </div>
                      {pendingBalance > 0 && (
                        <div className="flex justify-between text-lg font-semibold text-red-700 mt-2">
                          <span>Saldo Pendiente</span>
                          <span>${pendingBalance.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Panel lateral con información adicional */}
          <div className="space-y-6">
            {/* Información de fechas */}
            <Card className="bg-white/90 backdrop-blur-sm shadow-xl border border-cyan-100/50">
              <CardHeader>
                <CardTitle className="text-cyan-900">
                  Información de Fechas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-lg flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-cyan-600 mb-1">
                      Fecha de Creación
                    </p>
                    <p className="font-semibold text-cyan-900">
                      {formatDateTime(invoice.createdAt)}
                    </p>
                  </div>
                </div>

                {invoice.dueDate && (
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-amber-600 mb-1">
                        Fecha de Vencimiento
                      </p>
                      <p className="font-semibold text-amber-900">
                        {formatDate(invoice.dueDate)}
                      </p>
                    </div>
                  </div>
                )}

                {invoice.paidAt && (
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg flex items-center justify-center">
                      <DollarSign className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-green-600 mb-1">
                        Fecha de Pago
                      </p>
                      <p className="font-semibold text-green-900">
                        {formatDateTime(invoice.paidAt)}
                      </p>
                    </div>
                  </div>
                )}

                {/* Información adicional de la factura */}
                <div className="border-t border-cyan-200 pt-4">
                  <div className="grid grid-cols-1 gap-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-cyan-600">ID de Factura:</span>
                      <span className="font-mono text-cyan-900">
                        {invoice.id.slice(0, 12)}...
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-cyan-600">Número de Factura:</span>
                      <span className="font-semibold text-cyan-900">
                        #{invoice.invoiceNumber}
                      </span>
                    </div>
                    {invoice.orderId && (
                      <div className="flex justify-between">
                        <span className="text-cyan-600">ID de Orden:</span>
                        <span className="font-mono text-cyan-900">
                          {invoice.orderId.slice(0, 12)}...
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Información de la orden relacionada */}
            {order && (
              <Card className="bg-white/90 backdrop-blur-sm shadow-xl border border-cyan-100/50">
                <CardHeader>
                  <CardTitle className="text-cyan-900">
                    Orden Relacionada
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-cyan-600">
                      ID de Orden
                    </p>
                    <p className="font-semibold text-cyan-900">
                      #{order.id.slice(0, 8)}
                    </p>
                    <div className="space-y-3 mt-4">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-cyan-600">Estado:</span>
                          <p className="font-semibold text-cyan-900">
                            {order.status}
                          </p>
                        </div>
                        <div>
                          <span className="text-cyan-600">Total:</span>
                          <p className="font-semibold text-cyan-900">
                            ${(order.total || 0).toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <Link href={PRIVATE_ROUTES.ORDERS}>
                        <Button variant="outline" size="sm" className="w-full">
                          <Eye className="w-3 h-3 mr-2" />
                          Ver Orden Completa
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Métodos de Pago */}
            {paymentMethodsSummary.length > 0 && (
              <Card className="bg-white/90 backdrop-blur-sm shadow-xl border border-cyan-100/50">
                <CardHeader>
                  <CardTitle className="text-cyan-900 flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Métodos de Pago
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {paymentMethodsSummary.map((payment, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center p-3 bg-gradient-to-r from-cyan-50 to-teal-50 rounded-lg"
                      >
                        <div>
                          <span className="font-medium text-cyan-900">
                            {payment.method}
                          </span>
                          <span className="text-xs text-cyan-600 ml-2">
                            ({payment.count} pago{payment.count > 1 ? 's' : ''})
                          </span>
                        </div>
                        <span className="font-semibold text-cyan-900">
                          ${payment.amount.toFixed(2)}
                        </span>
                      </div>
                    ))}
                    <div className="border-t border-cyan-200 pt-3">
                      <div className="flex justify-between font-semibold text-cyan-900">
                        <span>Total Pagado:</span>
                        <span>${totalPaid.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Notas adicionales */}
            {invoice.notes && (
              <Card className="bg-white/90 backdrop-blur-sm shadow-xl border border-cyan-100/50">
                <CardHeader>
                  <CardTitle className="text-cyan-900">Notas</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-cyan-800">{invoice.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import { Button } from '@/components/shared/button/Button';
import { accountReceivableService } from '@/services/firebase/genericServices';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/shared/card/card';
import { Badge } from '@/components/shared/badge/badge';
import AccountsReceivableFilters from '@/features/accountsReceivable/AccountsReceivableFilters';
import { InvoiceStatusEnum } from '@/shared';
import { PRIVATE_ROUTES } from '@/shared/constantsRoutes/routes';

export default async function AccountsReceivablePage({
  searchParams,
}: {
  searchParams?: Promise<{ query?: string; status?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const query = resolvedSearchParams?.query || '';
  const statusFilter = resolvedSearchParams?.status || '';

  let accountsReceivable = await accountReceivableService.getAll();

  // Apply filters
  if (query) {
    accountsReceivable = accountsReceivable.filter(
      (ar) =>
        ar.customerName.toLowerCase().includes(query.toLowerCase()) ||
        ar.invoiceNumber.toLowerCase().includes(query.toLowerCase()) ||
        ar.description?.toLowerCase().includes(query.toLowerCase()),
    );
  }

  if (statusFilter) {
    accountsReceivable = accountsReceivable.filter(
      (ar) => ar.status === statusFilter,
    );
  }

  // Calculate totals
  const totalAmount = accountsReceivable.reduce(
    (sum, ar) => sum + ar.amount,
    0,
  );
  const totalPending = accountsReceivable.reduce(
    (sum, ar) => sum + (ar.amount - ar.paidAmount),
    0,
  );
  const totalPaid = accountsReceivable.reduce(
    (sum, ar) => sum + ar.paidAmount,
    0,
  );

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
    return new Date(date).toLocaleDateString('es-VE');
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Cuentas por Cobrar</h1>
        <div className="flex gap-2">
          <Link href={PRIVATE_ROUTES.ACCOUNTS_RECEIVABLE_NEW}>
            <Button>Nueva Cuenta por Cobrar</Button>
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-gray-600">
              Total Facturado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(totalAmount)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-gray-600">
              Total Pagado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(totalPaid)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-gray-600">
              Pendiente por Cobrar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">
              {formatCurrency(totalPending)}
            </p>
          </CardContent>
        </Card>
      </div>
      {/* Filters */}
      <AccountsReceivableFilters query={query} statusFilter={statusFilter} />
      {/* Accounts Receivable List */}
      <div className="grid grid-cols-1 gap-4">
        {accountsReceivable.map((receivable) => (
          <Link
            key={receivable.id}
            href={PRIVATE_ROUTES.ACCOUNTS_RECEIVABLE_DETAILS(receivable.id)}
          >
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg">
                        Factura #{receivable.invoiceNumber}
                      </h3>
                      {getStatusBadge(receivable.status)}
                    </div>
                    <p className="text-gray-600 mb-1">
                      Cliente: {receivable.customerName}
                    </p>
                    {receivable.description && (
                      <p className="text-sm text-gray-500 mb-2">
                        {receivable.description}
                      </p>
                    )}
                    <p className="text-sm text-gray-500">
                      Vencimiento: {formatDate(receivable.dueDate)}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-lg font-bold">
                      {formatCurrency(receivable.amount)}
                    </p>
                    {receivable.paidAmount > 0 && (
                      <p className="text-sm text-green-600">
                        Pagado: {formatCurrency(receivable.paidAmount)}
                      </p>
                    )}
                    <p className="text-sm text-red-600">
                      Pendiente:{' '}
                      {formatCurrency(
                        receivable.amount - receivable.paidAmount,
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {accountsReceivable.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">
            No se encontraron cuentas por cobrar
          </p>
          <Link
            href={PRIVATE_ROUTES.ACCOUNTS_RECEIVABLE_NEW}
            className="mt-4 inline-block"
          >
            <Button>Crear primera cuenta por cobrar</Button>
          </Link>
        </div>
      )}
    </div>
  );
}

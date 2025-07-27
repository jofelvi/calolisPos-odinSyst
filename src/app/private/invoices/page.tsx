'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ColumnDef } from '@tanstack/react-table';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/shared/card/card';
import { Badge } from '@/components/shared/badge/badge';
import { Button } from '@/components/shared/button/Button';
import Table from '@/components/shared/Table';
import Loader from '@/components/shared/Loader/Loader';
import { Calendar, DollarSign, Eye, FileText, Filter } from 'lucide-react';
import { PRIVATE_ROUTES } from '@/constants/routes';
import { invoiceService } from '@/services/firebase/genericServices';
import { Invoice } from '@/modelTypes/invoice';
import { InvoiceStatusEnum } from '@/modelTypes/enumShared';
import { formatDate } from '@/shared/utils/dateHelpers';
import PDFDownloadButton from '@/features/invoices/PDFDownloadButton';

export default function InvoicesPage() {
  const { status } = useSession();
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [statusFilter, setStatusFilter] = useState<InvoiceStatusEnum | 'ALL'>(
    'ALL',
  );

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/public/login');
    }
  }, [status, router]);

  useEffect(() => {
    const loadInvoices = async () => {
      if (status === 'authenticated') {
        try {
          const data = await invoiceService.getAll();
          // Ordenar por fecha de creación más reciente
          const sortedInvoices = data.sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          );
          setInvoices(sortedInvoices);
          setFilteredInvoices(sortedInvoices);
        } catch (error) {
          console.error('Error loading invoices:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    void loadInvoices();
  }, [status]);

  // Filtrar facturas por estado
  useEffect(() => {
    if (statusFilter === 'ALL') {
      setFilteredInvoices(invoices);
    } else {
      setFilteredInvoices(
        invoices.filter((invoice) => invoice.status === statusFilter),
      );
    }
  }, [statusFilter, invoices]);

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

  const columns: ColumnDef<Invoice>[] = [
    {
      accessorKey: 'invoiceNumber',
      header: 'Número',
      cell: ({ row }) => (
        <div className="font-mono font-semibold text-cyan-900">
          #{row.getValue('invoiceNumber')}
        </div>
      ),
    },
    {
      accessorKey: 'customerName',
      header: 'Cliente',
      cell: ({ row }) => (
        <div className="font-medium text-gray-900">
          {row.getValue('customerName') || 'Cliente no especificado'}
        </div>
      ),
    },
    {
      accessorKey: 'total',
      header: 'Total',
      cell: ({ row }) => {
        const total = row.getValue('total') as number;
        return (
          <div className="font-semibold text-green-700">
            ${(total || 0).toFixed(2)}
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Estado',
      cell: ({ row }) => {
        const status = row.getValue('status') as InvoiceStatusEnum;
        return (
          <Badge variant={getStatusVariant(status)}>
            {getStatusLabel(status)}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Fecha Creación',
      cell: ({ row }) => {
        const date = row.getValue('createdAt');
        return (
          <div className="text-sm text-gray-600">
            {date ? formatDate(date) : 'N/A'}
          </div>
        );
      },
    },
    {
      accessorKey: 'dueDate',
      header: 'Fecha Vencimiento',
      cell: ({ row }) => {
        const date = row.getValue('dueDate');
        return (
          <div className="text-sm text-gray-600">
            {date ? formatDate(date) : 'N/A'}
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: 'Acciones',
      cell: ({ row }) => {
        const invoice = row.original;
        return (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                router.push(PRIVATE_ROUTES.INVOICES_DETAILS(invoice.id))
              }
            >
              <Eye className="h-4 w-4" />
            </Button>
            <PDFDownloadButton
              invoice={invoice}
              variant="outline"
              size="sm"
              showPreview={false}
            />
          </div>
        );
      },
    },
  ];

  // Estadísticas
  const totalInvoices = invoices.length;
  const paidInvoices = invoices.filter(
    (inv) => inv.status === InvoiceStatusEnum.PAID,
  ).length;
  const pendingInvoices = invoices.filter(
    (inv) => inv.status === InvoiceStatusEnum.PENDING,
  ).length;
  const overdueInvoices = invoices.filter(
    (inv) => inv.status === InvoiceStatusEnum.OVERDUE,
  ).length;
  const totalRevenue = invoices
    .filter((inv) => inv.status === InvoiceStatusEnum.PAID)
    .reduce((sum, inv) => sum + (inv.total || 0), 0);

  if (status === 'loading' || isLoading) {
    return <Loader text="Cargando facturas..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-teal-50 to-blue-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-700 to-teal-600 bg-clip-text text-transparent mb-2">
          Gestión de Facturas
        </h1>
        <p className="text-cyan-600/80 text-lg">
          Historial completo de facturas del sistema
        </p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <Card className="hover:scale-105 transition-transform duration-300">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-cyan-600">
                Total Facturas
              </CardTitle>
              <FileText className="h-5 w-5 text-cyan-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-cyan-900">
              {totalInvoices}
            </div>
          </CardContent>
        </Card>

        <Card className="hover:scale-105 transition-transform duration-300">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-green-600">
                Pagadas
              </CardTitle>
              <DollarSign className="h-5 w-5 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">
              {paidInvoices}
            </div>
          </CardContent>
        </Card>

        <Card className="hover:scale-105 transition-transform duration-300">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-yellow-600">
                Pendientes
              </CardTitle>
              <Calendar className="h-5 w-5 text-yellow-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-900">
              {pendingInvoices}
            </div>
          </CardContent>
        </Card>

        <Card className="hover:scale-105 transition-transform duration-300">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-red-600">
                Vencidas
              </CardTitle>
              <Calendar className="h-5 w-5 text-red-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-900">
              {overdueInvoices}
            </div>
          </CardContent>
        </Card>

        <Card className="hover:scale-105 transition-transform duration-300">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-emerald-600">
                Ingresos
              </CardTitle>
              <DollarSign className="h-5 w-5 text-emerald-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-900">
              ${totalRevenue.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">
                Estado:
              </label>
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as InvoiceStatusEnum | 'ALL')
                }
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="ALL">Todos los estados</option>
                <option value={InvoiceStatusEnum.PAID}>Pagadas</option>
                <option value={InvoiceStatusEnum.PENDING}>Pendientes</option>
                <option value={InvoiceStatusEnum.OVERDUE}>Vencidas</option>
                <option value={InvoiceStatusEnum.CANCELLED}>Canceladas</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de facturas */}
      <Card className="bg-white/90 backdrop-blur-sm shadow-xl border border-cyan-100/50">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-cyan-900">
            Historial de Facturas ({filteredInvoices.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table data={filteredInvoices} columns={columns} />
        </CardContent>
      </Card>
    </div>
  );
}

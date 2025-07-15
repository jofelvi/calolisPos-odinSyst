'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/shared/input/input';
import SelectCustom from '@/components/shared/selectCustom/SelectCustom';
import { InvoiceStatusEnum } from '@/types/enumShared';

const statusOptions = [
  { value: '', label: 'Todos los estados' },
  { value: InvoiceStatusEnum.PENDING, label: 'Pendiente' },
  { value: InvoiceStatusEnum.PARTIALLY_PAID, label: 'Parcialmente Pagado' },
  { value: InvoiceStatusEnum.PAID, label: 'Pagado' },
  { value: InvoiceStatusEnum.OVERDUE, label: 'Vencido' },
];

interface AccountsReceivableFiltersProps {
  query: string;
  statusFilter: string;
}

export default function AccountsReceivableFilters({
  query,
  statusFilter,
}: AccountsReceivableFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    const params = new URLSearchParams(searchParams);

    if (newQuery) {
      params.set('query', newQuery);
    } else {
      params.delete('query');
    }

    router.push(`/private/accounts-receivable?${params.toString()}`);
  };

  const handleStatusChange = (value: string) => {
    const params = new URLSearchParams(searchParams);

    if (value) {
      params.set('status', value);
    } else {
      params.delete('status');
    }

    router.push(`/private/accounts-receivable?${params.toString()}`);
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6">
      <div className="flex-1">
        <Input
          type="search"
          placeholder="Buscar por cliente, factura o descripción..."
          defaultValue={query}
          onChange={handleQueryChange}
        />
      </div>
      <div className="md:w-48">
        <SelectCustom
          id="status-filter"
          options={statusOptions}
          value={statusFilter}
          placeholder="Filtrar por estado"
          onChange={handleStatusChange}
        />
      </div>
    </div>
  );
}

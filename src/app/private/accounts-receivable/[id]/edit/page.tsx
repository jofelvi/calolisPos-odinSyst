import { accountReceivableService } from '@/services/firebase/genericServices';
import AccountReceivableForm from '@/features/accountsReceivable/AccountReceivableForm';
import { notFound } from 'next/navigation';

interface EditAccountReceivablePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditAccountReceivablePage({
  params,
}: EditAccountReceivablePageProps) {
  const { id } = await params;

  const accountReceivable = await accountReceivableService.getById(id);

  if (!accountReceivable) {
    notFound();
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Editar Cuenta por Cobrar
        </h1>
        <p className="text-gray-600">
          Editando factura #{accountReceivable.invoiceNumber}
        </p>
      </div>

      <AccountReceivableForm accountReceivable={accountReceivable} />
    </div>
  );
}

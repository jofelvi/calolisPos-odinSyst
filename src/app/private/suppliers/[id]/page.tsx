import { supplierService } from '@/services/firebase/genericServices';
import SupplierForm from '@/app/components/suppliers/SupplierForm';

export default async function SupplierEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supplier = id === 'new' ? null : await supplierService.getById(id);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">
        {supplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}
      </h1>
      <div className="bg-white shadow rounded-lg p-6">
        <SupplierForm initialData={supplier} />
      </div>
    </div>
  );
}

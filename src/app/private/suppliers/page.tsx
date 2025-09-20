import Link from 'next/link';
import { supplierService } from '@/services/firebase/genericServices';
import { PRIVATE_ROUTES } from '@/shared';
import { Button } from '@/components/shared/button/Button';
import SuppliersTable from '@/features/suppliers/components/SuppliersTable';

export default async function SuppliersPage() {
  const suppliers = await supplierService.getAll();

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-teal-50 to-blue-50">
      <div className="container mx-auto px-1 py-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-700 to-teal-600 bg-clip-text text-transparent">
              Proveedores
            </h1>
            <p className="text-cyan-600/80 mt-1">
              Gestiona tus proveedores y su información de contacto
            </p>
          </div>
          <Link href={PRIVATE_ROUTES.SUPPLIERS_NEW}>
            <Button>Nuevo Proveedor</Button>
          </Link>
        </div>

        <SuppliersTable initialSuppliers={suppliers} />
      </div>
    </div>
  );
}

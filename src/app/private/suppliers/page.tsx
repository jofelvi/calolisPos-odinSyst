import Link from 'next/link';
import { supplierService } from '@/services/firebase/genericServices';
import { PRIVATE_ROUTES } from '@/constants/routes';
import { Button } from '@/components/shared/button/Button';

export default async function SuppliersPage() {
  const suppliers = await supplierService.getAll();

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-teal-50 to-blue-50">
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-700 to-teal-600 bg-clip-text text-transparent">Proveedores</h1>
            <p className="text-cyan-600/80 mt-1">Gestiona tus proveedores y su información de contacto</p>
          </div>
          <Link href={PRIVATE_ROUTES.SUPPLIERS_NEW}>
            <Button>Nuevo Proveedor</Button>
          </Link>
        </div>

        <div className="bg-white/90 backdrop-blur-sm shadow-xl rounded-2xl overflow-hidden border border-cyan-100/50">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gradient-to-r from-cyan-50 to-teal-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-cyan-700 uppercase tracking-wider">
                Nombre
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-cyan-700 uppercase tracking-wider">
                Contacto
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-cyan-700 uppercase tracking-wider">
                Teléfono
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-cyan-700 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-cyan-700 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white/80 divide-y divide-cyan-100">
            {suppliers.map((supplier) => (
              <tr key={supplier.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-semibold text-cyan-900">
                    {supplier.name}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-cyan-700">
                  {supplier.contactName || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-cyan-700">
                  {supplier.phone || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${supplier.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                  >
                    {supplier.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <Link
                    href={PRIVATE_ROUTES.SUPPLIERS_EDIT(supplier.id)}
                    className="text-cyan-600 hover:text-cyan-800 font-medium mr-4 transition-colors duration-200"
                  >
                    Editar
                  </Link>
                  <button className="text-red-600 hover:text-red-800 font-medium transition-colors duration-200">
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}

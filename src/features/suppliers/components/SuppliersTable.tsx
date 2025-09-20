'use client';

import Link from 'next/link';
import { useState } from 'react';
import { supplierService } from '@/services/firebase/genericServices';
import { PRIVATE_ROUTES } from '@/shared';
import { Supplier } from '@/modelTypes/supplier';
import { useRouter } from 'next/navigation';
import DeleteSupplierModal from './DeleteSupplierModal';
import { useToast } from '@/shared/hooks/useToast';
import { Edit, Trash2 } from 'lucide-react';

interface SuppliersTableProps {
  initialSuppliers: Supplier[];
}

export default function SuppliersTable({
  initialSuppliers,
}: SuppliersTableProps) {
  const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers);
  const [isDeleting, setIsDeleting] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(
    null,
  );
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const router = useRouter();
  const toast = useToast();

  const handleDeleteClick = (supplier: Supplier) => {
    setSupplierToDelete(supplier);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!supplierToDelete) return;

    setIsDeleting(true);
    try {
      await supplierService.delete(supplierToDelete.id);
      setSuppliers(suppliers.filter((s) => s.id !== supplierToDelete.id));
      toast.success({
        title: 'Proveedor eliminado',
        description: `El proveedor "${supplierToDelete.name}" ha sido eliminado exitosamente`,
      });
      router.refresh();
      setShowDeleteModal(false);
    } catch {
      toast.error({
        title: 'Error al eliminar',
        description:
          'No se pudo eliminar el proveedor. Por favor intenta de nuevo.',
      });
    } finally {
      setIsDeleting(false);
      setSupplierToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setSupplierToDelete(null);
  };

  return (
    <div className="bg-white/90 backdrop-blur-sm shadow-xl rounded-2xl overflow-hidden border border-cyan-100/50">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-cyan-900">
          <tr>
            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-200 uppercase tracking-wider">
              Nombre
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-200 uppercase tracking-wider">
              Contacto
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-200 uppercase tracking-wider">
              Teléfono
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-200 uppercase tracking-wider">
              Estado
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-200 uppercase tracking-wider">
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
                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    supplier.isActive
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {supplier.isActive ? 'Activo' : 'Inactivo'}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div className="flex items-center gap-2">
                  <Link
                    href={PRIVATE_ROUTES.SUPPLIERS_EDIT(supplier.id)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-cyan-600 hover:text-cyan-700 hover:bg-cyan-50 rounded-lg transition-all duration-200"
                  >
                    <Edit className="h-4 w-4" />
                    <span>Editar</span>
                  </Link>
                  <button
                    onClick={() => handleDeleteClick(supplier)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Eliminar</span>
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {suppliers.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">
            No hay proveedores registrados
          </p>
          <Link
            href={PRIVATE_ROUTES.SUPPLIERS_NEW}
            className="text-cyan-600 hover:text-cyan-800 font-medium mt-2 inline-block"
          >
            Crear primer proveedor
          </Link>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteSupplierModal
        isOpen={showDeleteModal}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        supplier={supplierToDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
}

'use client';

import { Supplier } from '@/modelTypes/supplier';
import Modal from '@/shared/ui/modal';
import { Button } from '@/shared';
import { AlertTriangle } from 'lucide-react';

interface DeleteSupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  supplier: Supplier | null;
  isDeleting: boolean;
}

export default function DeleteSupplierModal({
  isOpen,
  onClose,
  onConfirm,
  supplier,
  isDeleting,
}: DeleteSupplierModalProps) {
  if (!supplier) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6">
        {/* Icon */}
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 mb-4">
          <AlertTriangle className="h-8 w-8 text-red-600" />
        </div>

        {/* Title */}
        <div className="text-center mb-4">
          <h3 className="text-xl font-semibold text-gray-900">
            Eliminar Proveedor
          </h3>
        </div>

        {/* Message */}
        <div className="text-center mb-6">
          <p className="text-gray-600">
            ¿Estás seguro de que deseas eliminar el proveedor{' '}
            <span className="font-semibold text-gray-900">
              &#34;{supplier.name}&#34;
            </span>
            ?
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Esta acción no se puede deshacer y eliminará toda la información
            relacionada con este proveedor.
          </p>
        </div>

        {/* Supplier Details */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-500">Nombre:</span>
              <span className="font-medium text-gray-900">{supplier.name}</span>
            </div>
            {supplier.contactName && (
              <div className="flex justify-between">
                <span className="text-gray-500">Contacto:</span>
                <span className="font-medium text-gray-900">
                  {supplier.contactName}
                </span>
              </div>
            )}
            {supplier.phone && (
              <div className="flex justify-between">
                <span className="text-gray-500">Teléfono:</span>
                <span className="font-medium text-gray-900">
                  {supplier.phone}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-500">Estado:</span>
              <span
                className={`font-medium ${
                  supplier.isActive ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {supplier.isActive ? 'Activo' : 'Inactivo'}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isDeleting}
            className="px-6"
          >
            Cancelar
          </Button>
          <Button
            variant="default"
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-6 bg-red-600 hover:bg-red-700 text-white"
          >
            {isDeleting ? 'Eliminando...' : 'Eliminar Proveedor'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

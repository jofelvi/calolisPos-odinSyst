// features/shared/DeleteConfirmationModal.tsx
'use client';

import { FiAlertTriangle, FiTrash2, FiX } from 'react-icons/fi';
import Modal from '@/components/shared/modal';
import { Button } from '@/components/shared/button/Button';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  isLoading?: boolean;
  items?: string[]; // Lista de productos asociados
}

export const DeleteConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  isLoading = false,
  items = [],
}: DeleteConfirmationModalProps) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <FiAlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-medium text-gray-900">{title}</h3>
            <div className="mt-2">
              <p className="text-sm text-gray-500">{description}</p>

              {items.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-700">
                    Productos asociados ({items.length}):
                  </p>
                  <div className="mt-2 max-h-40 overflow-y-auto border border-gray-200 rounded-md p-2">
                    <ul className="list-disc pl-5 space-y-1">
                      {items.slice(0, 10).map((item, index) => (
                        <li
                          key={index}
                          className="text-sm text-gray-600 truncate"
                        >
                          {item}
                        </li>
                      ))}
                      {items.length > 10 && (
                        <li className="text-sm text-gray-500">
                          ...y {items.length - 10} más
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="border-gray-300"
          >
            <FiX className="mr-2" /> Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            isLoading={isLoading}
            startIcon={<FiTrash2 />}
          >
            Eliminar
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// features/tables/TableForm.tsx
'use client';

import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  TableFormValues,
  tableSchema,
} from '@/features/types/schemaYup/tableSchema';
import { TableStatusEnum } from '@/modelTypes/enumShared';
import { tableService } from '@/services/firebase/genericServices';
import { Table } from '@/modelTypes/table';

interface TableFormProps {
  initialData?: Table | null;
  isNew?: boolean;
}

export default function TableForm({
  initialData = null,
  isNew = false,
}: TableFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TableFormValues>({
    resolver: yupResolver(tableSchema),
    defaultValues: {
      name: '',
      number: 0,
      capacity: 2,
      status: TableStatusEnum.ISAVAILABLE,
      isAvailable: true,
      orderId: null,
    },
  });

  // Cargar datos iniciales
  useEffect(() => {
    if (initialData) {
      reset({
        ...initialData,
        orderId: initialData.orderId || null,
      });
    }
  }, [initialData, reset]);

  const onSubmit = async (data: TableFormValues) => {
    setIsSubmitting(true);
    try {
      const tableData = {
        ...data,
      };

      if (isNew) {
        await tableService.create(tableData);
      } else if (initialData?.id) {
        await tableService.update(initialData.id, tableData);
      }

      router.push('/tables');
    } catch (error) {
      // Handle error appropriately - could show a toast notification here
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const status = watch('status');
    setValue('isAvailable', status === TableStatusEnum.ISAVAILABLE);
  }, [watch('status'), setValue]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {Object.keys(errors).length > 0 && (
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
          <ul className="list-disc pl-5">
            {Object.entries(errors).map(([key, err]) => (
              <li key={key}>{(err as { message: string }).message}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Campo Nombre */}
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700"
          >
            Nombre *
          </label>
          <input
            id="name"
            {...register('name')}
            className={`mt-1 block w-full border ${
              errors.name ? 'border-red-500' : 'border-gray-300'
            } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>

        {/* Campo Número */}
        <div>
          <label
            htmlFor="number"
            className="block text-sm font-medium text-gray-700"
          >
            Número *
          </label>
          <input
            type="number"
            id="number"
            {...register('number')}
            className={`mt-1 block w-full border ${
              errors.number ? 'border-red-500' : 'border-gray-300'
            } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
          />
          {errors.number && (
            <p className="mt-1 text-sm text-red-600">{errors.number.message}</p>
          )}
        </div>

        {/* Campo Capacidad */}
        <div>
          <label
            htmlFor="capacity"
            className="block text-sm font-medium text-gray-700"
          >
            Capacidad *
          </label>
          <input
            type="number"
            id="capacity"
            {...register('capacity')}
            className={`mt-1 block w-full border ${
              errors.capacity ? 'border-red-500' : 'border-gray-300'
            } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
          />
          {errors.capacity && (
            <p className="mt-1 text-sm text-red-600">
              {errors.capacity.message}
            </p>
          )}
        </div>

        {/* Campo Estado */}
        <div>
          <label
            htmlFor="status"
            className="block text-sm font-medium text-gray-700"
          >
            Estado *
          </label>
          <select
            id="status"
            {...register('status')}
            className={`mt-1 block w-full border ${
              errors.status ? 'border-red-500' : 'border-gray-300'
            } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
          >
            <option value={TableStatusEnum.ISAVAILABLE}>Disponible</option>
            <option value={TableStatusEnum.OCCUPIED}>Ocupada</option>
            <option value={TableStatusEnum.RESERVED}>Reservada</option>
            <option value={TableStatusEnum.CLEANING}>Limpieza</option>
          </select>
          {errors.status && (
            <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>
          )}
        </div>

        {/* Campo Disponibilidad (automático) */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="isAvailable"
            {...register('isAvailable')}
            disabled
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label
            htmlFor="isAvailable"
            className="ml-2 block text-sm text-gray-700"
          >
            Disponible para reservar
          </label>
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={() => router.push('/tables')}
          className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          disabled={isSubmitting}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="bg-blue-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <span className="flex items-center">
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              {isNew ? 'Creando...' : 'Actualizando...'}
            </span>
          ) : isNew ? (
            'Crear Mesa'
          ) : (
            'Actualizar'
          )}
        </button>
      </div>
    </form>
  );
}

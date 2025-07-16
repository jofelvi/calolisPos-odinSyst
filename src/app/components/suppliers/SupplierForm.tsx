'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Supplier } from '@/types/supplier';
import {
  productService,
  supplierService,
} from '@/services/firebase/genericServices';
import { SupplierFormData, supplierSchema } from '@/schemas/supplier-schema';
import { useForm } from 'react-hook-form';
import { Product } from '@/types/product';
import { yupResolver } from '@hookform/resolvers/yup';

interface SupplierFormProps {
  initialData?: Supplier | null;
}

export default function SupplierForm({ initialData }: SupplierFormProps) {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SupplierFormData>({
    resolver: yupResolver(supplierSchema),
    defaultValues: {
      isActive: true,
      productIds: [],
    },
  });

  // Cargar productos y datos iniciales
  useEffect(() => {
    const loadData = async () => {
      const productsData = await productService.getAll();
      setProducts(productsData);

      if (initialData) {
        reset({
          ...initialData,
          productIds: initialData.productIds || [],
        });
      }
    };

    loadData();
  }, [initialData, reset]);

  const onSubmit = async (data: SupplierFormData) => {
    setIsSubmitting(true);
    try {
      const supplierData = {
        ...data,
        createdAt: initialData?.createdAt || new Date(),
      };

      if (initialData) {
        // Actualizar proveedor existente
        await supplierService.update(initialData.id, supplierData);
      } else {
        // Crear nuevo proveedor
        await supplierService.create(supplierData);
      }

      // Actualizar productos con el proveedor
      await updateProductsWithSupplier(initialData?.id, data.productIds || []);

      router.push('/suppliers');
    } catch (error) {
      // Handle error appropriately - could show a toast notification here
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Actualizar la relación proveedor-producto
  const updateProductsWithSupplier = async (
    supplierId: string | undefined,
    selectedProductIds: string[],
  ) => {
    if (!supplierId) return;

    // Para cada producto, actualizar la lista de proveedores
    for (const product of products) {
      const currentSupplierIds = product.supplierIds || [];
      const isSelected = selectedProductIds.includes(product.id);
      const shouldUpdate =
        (isSelected && !currentSupplierIds.includes(supplierId)) ||
        (!isSelected && currentSupplierIds.includes(supplierId));

      if (shouldUpdate) {
        const updatedSupplierIds = isSelected
          ? [...currentSupplierIds, supplierId]
          : currentSupplierIds.filter((id) => id !== supplierId);

        await productService.update(product.id, {
          supplierIds: updatedSupplierIds,
        });
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Campo Nombre */}
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700"
          >
            Nombre del Proveedor *
          </label>
          <input
            id="name"
            {...register('name')}
            className={`mt-1 block w-full border ${errors.name ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>

        {/* Campo Persona de Contacto */}
        <div>
          <label
            htmlFor="contactName"
            className="block text-sm font-medium text-gray-700"
          >
            Persona de Contacto
          </label>
          <input
            id="contactName"
            {...register('contactName')}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Campo Teléfono */}
        <div>
          <label
            htmlFor="phone"
            className="block text-sm font-medium text-gray-700"
          >
            Teléfono
          </label>
          <input
            id="phone"
            {...register('phone')}
            className={`mt-1 block w-full border ${errors.phone ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
          />
          {errors.phone && (
            <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
          )}
        </div>

        {/* Campo Email */}
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700"
          >
            Email
          </label>
          <input
            type="email"
            id="email"
            {...register('email')}
            className={`mt-1 block w-full border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        {/* Campo Dirección */}
        <div className="md:col-span-2">
          <label
            htmlFor="address"
            className="block text-sm font-medium text-gray-700"
          >
            Dirección
          </label>
          <input
            id="address"
            {...register('address')}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Campo Estado */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="isActive"
            {...register('isActive')}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label
            htmlFor="isActive"
            className="ml-2 block text-sm text-gray-700"
          >
            Proveedor activo
          </label>
        </div>

        {/* Campo Productos */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Productos que provee
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {products.map((product) => (
              <div key={product.id} className="flex items-center">
                <input
                  type="checkbox"
                  id={`product-${product.id}`}
                  value={product.id}
                  {...register('productIds')}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label
                  htmlFor={`product-${product.id}`}
                  className="ml-2 block text-sm text-gray-700"
                >
                  {product.name} ({product.sku || 'sin SKU'})
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={() => router.push('/suppliers')}
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
              {initialData ? 'Actualizando...' : 'Creando...'}
            </span>
          ) : initialData ? (
            'Actualizar'
          ) : (
            'Crear Proveedor'
          )}
        </button>
      </div>
    </form>
  );
}

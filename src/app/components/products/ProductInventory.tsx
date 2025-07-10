import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { ProductFormData } from '@/app/components/types/schemaYup/productSchema';

interface ProductInventoryProps {
  register: UseFormRegister<ProductFormData>;
  errors: FieldErrors<ProductFormData>;
}

export default function ProductInventory({
  register,
  errors,
}: ProductInventoryProps) {
  return (
    <>
      {/* Stock */}
      <div>
        <label
          htmlFor="stock"
          className="block text-sm font-medium text-gray-700"
        >
          Stock *
        </label>
        <input
          type="number"
          id="stock"
          {...register('stock')}
          className={`mt-1 block w-full border ${errors.stock ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
        />
        {errors.stock && (
          <p className="mt-1 text-sm text-red-600">{errors.stock.message}</p>
        )}
      </div>

      {/* Stock Mínimo */}
      <div>
        <label
          htmlFor="minStock"
          className="block text-sm font-medium text-gray-700"
        >
          Stock Mínimo
        </label>
        <input
          type="number"
          id="minStock"
          {...register('minStock')}
          className={`mt-1 block w-full border ${errors.minStock ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
        />
        {errors.minStock && (
          <p className="mt-1 text-sm text-red-600">{errors.minStock.message}</p>
        )}
      </div>

      {/* SKU */}
      <div>
        <label
          htmlFor="sku"
          className="block text-sm font-medium text-gray-700"
        >
          SKU
        </label>
        <input
          id="sku"
          {...register('sku')}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Código de Barras */}
      <div>
        <label
          htmlFor="barcode"
          className="block text-sm font-medium text-gray-700"
        >
          Código de Barras
        </label>
        <input
          id="barcode"
          {...register('barcode')}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </>
  );
}

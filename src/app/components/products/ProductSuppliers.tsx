import { UseFormRegister } from 'react-hook-form';
import { Supplier } from '@/types/supplier';
import { ProductFormData } from '@/app/components/types/schemaYup/productSchema';

interface ProductSuppliersProps {
  register: UseFormRegister<ProductFormData>;
  suppliers: Supplier[];
  disabled?: boolean;
}

export default function ProductSuppliers({
  register,
  suppliers,
  disabled,
}: ProductSuppliersProps) {
  return (
    <div
      className={`md:col-span-2 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
    >
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Proveedores
      </label>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
        {suppliers.map((supplier) => (
          <div key={supplier.id} className="flex items-center">
            <input
              type="checkbox"
              id={`supplier-${supplier.id}`}
              value={supplier.id}
              {...register('supplierIds')}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label
              htmlFor={`supplier-${supplier.id}`}
              className="ml-2 block text-sm text-gray-700"
            >
              {supplier.name}
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}

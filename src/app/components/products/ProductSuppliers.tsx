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
      <label className="block text-sm font-semibold mb-3 text-cyan-700">
        Proveedores
      </label>
      {disabled && (
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2 mb-3">
          ⚠️ Los productos tipo &quot;Mixto&quot; no necesitan proveedores
          directos
        </p>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {suppliers.map((supplier) => (
          <div
            key={supplier.id}
            className="flex items-center space-x-3 p-3 bg-gradient-to-r from-slate-50 to-gray-50 rounded-xl border border-gray-200 hover:shadow-sm transition-all duration-200"
          >
            <input
              type="checkbox"
              id={`supplier-${supplier.id}`}
              value={supplier.id}
              {...register('supplierIds')}
              className="h-4 w-4 text-cyan-600 focus:ring-cyan-500 border-cyan-300 rounded bg-white/90 backdrop-blur-sm transition-all duration-200"
            />
            <label
              htmlFor={`supplier-${supplier.id}`}
              className="text-sm font-medium text-gray-700 cursor-pointer flex-1"
            >
              {supplier.name}
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}

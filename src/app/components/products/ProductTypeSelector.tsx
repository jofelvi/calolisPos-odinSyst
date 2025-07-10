import { FieldErrors, UseFormRegister, UseFormWatch } from 'react-hook-form';
import { ProductFormData } from '@/app/components/types/schemaYup/productSchema';
import { ProductTypeEnum } from '@/types/enumShared';

interface ProductTypeSelectorProps {
  register: UseFormRegister<ProductFormData>;
  errors: FieldErrors<ProductFormData>;
  watch: UseFormWatch<ProductFormData>;
}

export default function ProductTypeSelector({
  register,
  errors,
  watch,
}: ProductTypeSelectorProps) {
  const selectedType = watch('type');

  return (
    <div>
      <label htmlFor="type" className="block text-sm font-medium text-gray-700">
        Tipo de Producto *
      </label>
      <select
        id="type"
        {...register('type')}
        className={`mt-1 block w-full border ${
          errors.type ? 'border-red-500' : 'border-gray-300'
        } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
      >
        <option value="">Selecciona un tipo</option>
        <option value={ProductTypeEnum.BASE}>Producto Base</option>
        <option value={ProductTypeEnum.MIXED}>Producto Mixto</option>
      </select>
      {errors.type && (
        <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
      )}

      {/* Ayuda contextual */}
      <div className="mt-2 text-xs text-gray-500">
        {selectedType === ProductTypeEnum.BASE && (
          <p>• Producto Base: Producto individual con su propio stock</p>
        )}
        {selectedType === ProductTypeEnum.MIXED && (
          <p>
            • Producto Mixto: Compuesto por otros productos (ej: hamburguesa con
            ingredientes)
          </p>
        )}
      </div>
    </div>
  );
}

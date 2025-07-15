import { FieldErrors, UseFormRegister } from 'react-hook-form';
import { Category } from '@/types/category';
import { ProductFormData } from '@/app/components/types/schemaYup/productSchema';
import { ProductTypeEnum } from '@/types/enumShared';
import { Input } from '@/components/shared/input/input';
import {
  arrayToSelectOptions,
  enumToSelectOptions,
} from '@/utils/enumToSelectOptions';
import SelectCustom from '@/components/shared/selectCustom/SelectCustom';
import { Button } from '@/components/shared/button/Button';

interface ProductBasicInfoProps {
  register: UseFormRegister<ProductFormData>;
  errors: FieldErrors<ProductFormData>;
  categories: Category[];
  onAddCategory: () => void;
}

export default function ProductBasicInfo({
  register,
  errors,
  categories,
  onAddCategory,
}: ProductBasicInfoProps) {
  return (
    <>
      {/* Nombre */}
      <Input
        label="Nombre *"
        id="name"
        {...register('name')}
        error={errors.name?.message}
      />
      {/* Categoría */}
      <div>
        <SelectCustom<ProductFormData>
          id={`categoryId`}
          name={`categoryId`}
          label="Categoría *"
          options={arrayToSelectOptions(categories, 'id', 'name')}
          error={errors.categoryId}
          placeholder="Seleccionar Categoría..."
          className="w-full"
          register={register}
        />
        <div className="mt-2">
          <Button
            type="button"
            onClick={onAddCategory}
            variant="outline"
            size="sm"
            className="bg-white/80 border-cyan-200 text-cyan-700 hover:bg-cyan-50 hover:border-cyan-300"
          >
            + Agregar nueva categoría
          </Button>
        </div>
      </div>

      {/* Descripción */}
      <div className="md:col-span-2">
        <label
          htmlFor="description"
          className="block text-sm font-semibold mb-2 text-cyan-700"
        >
          Descripción
        </label>
        <textarea
          id="description"
          {...register('description')}
          rows={3}
          placeholder="Describe las características del producto..."
          className="w-full rounded-xl border border-cyan-200 bg-white/90 backdrop-blur-sm py-3 px-3 text-sm shadow-sm transition-all duration-200 ease-in-out placeholder:text-cyan-400/60 focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-cyan-500 focus:ring-cyan-500/30 focus:bg-white resize-none"
        />
      </div>
      <div className="grid grid-cols-1 gap-6">
        <SelectCustom<ProductFormData>
          id={`type`}
          name={`type`}
          label="Tipo de Producto *"
          options={enumToSelectOptions(ProductTypeEnum)}
          error={errors.categoryId}
          placeholder="Seleccionar Tipo..."
          className="w-full"
          register={register}
        />
      </div>

      {/* Estado para venta */}
      <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-slate-50 to-gray-50 rounded-xl border border-gray-200">
        <input
          type="checkbox"
          id="isForSale"
          {...register('isForSale')}
          className="h-5 w-5 text-cyan-600 focus:ring-cyan-500 border-cyan-300 rounded bg-white/90 backdrop-blur-sm transition-all duration-200"
        />
        <label
          htmlFor="isForSale"
          className="text-sm font-semibold text-cyan-700 cursor-pointer"
        >
          Producto disponible para venta
        </label>
      </div>
    </>
  );
}

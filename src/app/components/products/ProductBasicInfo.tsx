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
            className="mt-2inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 shadow-sm hover:shadow-md"
          >
            + Agregar nueva categoría
          </Button>
        </div>
      </div>

      {/* Descripción */}
      <div className="md:col-span-2">
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-700"
        >
          Descripción
        </label>
        <textarea
          id="description"
          {...register('description')}
          rows={3}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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
    </>
  );
}

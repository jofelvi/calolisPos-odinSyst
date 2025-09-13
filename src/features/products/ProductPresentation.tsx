import { useEffect } from 'react';
import {
  Control,
  FieldErrors,
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
} from 'react-hook-form';
import { ProductFormData } from '../types/schemaYup/productSchema';
import { ProductPresentationEnum } from '@/shared';
import SelectCustom from '@/components/shared/selectCustom/SelectCustom';
import {
  defaultQuantities,
  presentationLabels,
} from '@/features/products/productsUtils';
import { Input } from '@/components/shared/input/input';

interface ProductPresentationProps {
  control: Control<ProductFormData>;
  register: UseFormRegister<ProductFormData>;
  errors: FieldErrors<ProductFormData>;
  watch: UseFormWatch<ProductFormData>;
  setValue: UseFormSetValue<ProductFormData>;
}

export default function ProductPresentation({
  register,
  errors,
  watch,
  setValue,
}: ProductPresentationProps) {
  const presentation = watch('presentation');
  const presentationQuantity = watch('presentationQuantity');

  useEffect(() => {
    if (!presentationQuantity && presentation) {
      setValue('presentationQuantity', defaultQuantities[presentation]);
    }
  }, [presentation, presentationQuantity, setValue, watch]);

  return (
    <>
      {/* Tipo de Presentación */}
      <SelectCustom<ProductFormData>
        id="presentation"
        name="presentation"
        label="Presentación"
        register={register}
        options={Object.values(ProductPresentationEnum).map((value) => ({
          value,
          label: `${value} - ${presentationLabels[value]}`,
        }))}
        error={errors.presentation?.message}
      />
      {/* Cantidad por Presentación */}
      <Input
        id="presentationQuantity"
        type="number"
        min={1}
        variant="numeric"
        label="Cantidad por Presentación"
        {...register('presentationQuantity')}
        error={errors.presentationQuantity?.message}
        textHelper="Ej: 1 para unidad, 12 para docena, etc."
      />

      {/* Estado Activo */}
      <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-slate-50 to-gray-50 rounded-xl border border-gray-200">
        <input
          type="checkbox"
          id="isActive"
          {...register('isActive')}
          className="h-5 w-5 text-cyan-600 focus:ring-cyan-500 border-cyan-300 rounded bg-white/90 backdrop-blur-sm transition-all duration-200"
        />
        <label
          htmlFor="isActive"
          className="text-sm font-semibold text-cyan-700 cursor-pointer"
        >
          Producto activo
        </label>
      </div>
    </>
  );
}

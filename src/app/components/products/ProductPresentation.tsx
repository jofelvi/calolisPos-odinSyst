import { useEffect } from 'react';
import {
  Control,
  FieldErrors,
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
} from 'react-hook-form';
import { ProductFormData } from '../types/schemaYup/productSchema';
import { ProductPresentationEnum } from '@/types/enumShared';
import SelectCustom from '@/components/shared/selectCustom/SelectCustom';
import {
  defaultQuantities,
  presentationLabels,
} from '@/app/components/products/productsUtils';
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
      <div>
        <Input
          id="presentationQuantity"
          type="number"
          min={1}
          label="Cantidad por Presentación"
          {...register('presentationQuantity')}
          error={errors.presentationQuantity?.message}
          textHelper="Ej: 1 para unidad, 12 para docena, etc."
          className={`mt-1 block w-full border ${errors.presentationQuantity ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
        />
      </div>
    </>
  );
}

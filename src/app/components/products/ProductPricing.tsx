import { CurrencyEnum, ProductTypeEnum } from '@/types/enumShared';
import { FieldErrors, UseFormRegister, UseFormWatch } from 'react-hook-form';
import { ProductFormData } from '@/app/components/types/schemaYup/productSchema';
import { Input } from '@/components/shared/input/input';
import { FaInfoCircle } from 'react-icons/fa';
import { DollarSign } from 'lucide-react';
import SelectCustom from '@/components/shared/selectCustom/SelectCustom';
import { enumToSelectOptions } from '@/utils/enumToSelectOptions';

interface ProductPricingProps {
  register: UseFormRegister<ProductFormData>;
  errors: FieldErrors<ProductFormData>;
  watch: UseFormWatch<ProductFormData>;
}

export default function ProductPricing({
  register,
  errors,
  watch,
}: ProductPricingProps) {
  const type = watch('type');

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2 mb-6">
        <DollarSign className="w-5 h-5 text-blue-600" />
        Precios y Costos
      </h3>

      <div>
        <SelectCustom<ProductFormData>
          id="currency"
          name="currency"
          label="Moneda *"
          className="mb-2"
          register={register}
          options={enumToSelectOptions(CurrencyEnum)}
          error={errors.currency?.message}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Precio de Venta */}
        <div className="space-y-2">
          <label
            htmlFor="price"
            className="block text-sm font-medium text-gray-700"
          >
            Precio de Venta *
          </label>
          <div className="relative">
            <Input
              id="price"
              type="number"
              min={0.01}
              step={0.01}
              icon={DollarSign}
              {...register('price')}
              error={errors.price?.message}
              placeholder="0.00"
            />
          </div>
          <p className="text-xs text-gray-500">
            Precio al que se vende al cliente
          </p>
        </div>

        {/* Costo de Elaboración */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <label
              htmlFor="cost"
              className="block text-sm font-medium text-gray-700"
            >
              Costo de Elaboración *
            </label>
            {type === ProductTypeEnum.MIXED && (
              <span className="inline-flex items-center px-2 py-1 rounded-md bg-green-50 text-green-700 text-xs font-medium">
                Calculado auto.
              </span>
            )}
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 text-sm font-medium">$</span>
            </div>
            <Input
              id="cost"
              type="number"
              min={0}
              step={0.01}
              {...register('cost')}
              error={errors.cost?.message}
              disabled={type === ProductTypeEnum.MIXED}
              className={
                type === ProductTypeEnum.MIXED
                  ? 'bg-gray-50 pl-8 cursor-not-allowed'
                  : 'pl-8'
              }
              placeholder="0.00"
            />
          </div>
          {type === ProductTypeEnum.MIXED && (
            <div className="flex items-start gap-2 p-2 bg-blue-50 rounded-md">
              <FaInfoCircle
                className="text-blue-500 mt-0.5 flex-shrink-0"
                size={12}
              />
              <p className="text-xs text-blue-700">
                Basado en ingredientes + 10% merma
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

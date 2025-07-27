import { CurrencyEnum, ProductTypeEnum } from '@/modelTypes/enumShared';
import { FieldErrors, UseFormRegister, UseFormWatch } from 'react-hook-form';
import { ProductFormData } from '@/features/types/schemaYup/productSchema';
import { Input } from '@/components/shared/input/input';
import { FaInfoCircle } from 'react-icons/fa';
import { DollarSign } from 'lucide-react';
import SelectCustom from '@/components/shared/selectCustom/SelectCustom';
import { enumToSelectOptions } from '@/shared/utils/enumToSelectOptions';

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
  const isForSale = watch('isForSale');

  return (
    <>
      {/* Moneda */}
      <SelectCustom<ProductFormData>
        id="currency"
        name="currency"
        label="Moneda *"
        register={register}
        options={enumToSelectOptions(CurrencyEnum)}
        error={errors.currency?.message}
      />

      {/* Precio */}
      <Input
        label={isForSale ? 'Precio de Venta *' : 'Precio de Compra *'}
        id="price"
        type="number"
        min={0.01}
        step={0.01}
        variant="numeric"
        icon={DollarSign}
        {...register('price')}
        error={errors.price?.message}
        placeholder="0.00"
        textHelper={
          isForSale
            ? 'Precio al que se vende al cliente'
            : 'Precio al que se compra el producto'
        }
      />

      {/* Costo de Elaboración */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <label className="block text-sm font-semibold text-cyan-700">
            Costo de Elaboración *
          </label>
          {type === ProductTypeEnum.MIXED && (
            <span className="inline-flex items-center px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-200">
              🤖 Calculado automáticamente
            </span>
          )}
        </div>
        <Input
          id="cost"
          type="number"
          min={0}
          step={0.01}
          variant="numeric"
          icon={DollarSign}
          {...register('cost')}
          error={errors.cost?.message}
          disabled={type === ProductTypeEnum.MIXED}
          placeholder="0.00"
        />
        {type === ProductTypeEnum.MIXED && (
          <div className="flex items-start gap-2 p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-200">
            <FaInfoCircle
              className="text-cyan-600 mt-0.5 flex-shrink-0"
              size={14}
            />
            <p className="text-sm text-cyan-700 font-medium">
              Se calcula automáticamente basado en los ingredientes + 10% de
              merma
            </p>
          </div>
        )}
      </div>
    </>
  );
}

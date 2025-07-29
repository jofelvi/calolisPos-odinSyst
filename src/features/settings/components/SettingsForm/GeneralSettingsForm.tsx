import React from 'react';
import { FieldErrors, UseFormRegister, UseFormWatch } from 'react-hook-form';
import { DollarSign, Globe } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  SelectCustom,
} from '@/shared';
import {
  currencyOptions,
  dateFormatOptions,
  GeneralSettingsFormData,
  languageOptions,
  timezoneOptions,
} from '@/features/settings';

// Create a type that represents the common settings fields
type GeneralSettingsFields = {
  currency: string;
  language: string;
  timezone: string;
  dateFormat: string;
  taxRate: number;
  enableTips?: boolean;
  defaultTipPercentage?: number;
};

interface GeneralSettingsFormProps<
  T extends GeneralSettingsFields = GeneralSettingsFormData,
> {
  register: UseFormRegister<T>;
  errors: FieldErrors<T>;
  watch: UseFormWatch<T>;
}

export default function GeneralSettingsForm({
  register,
  errors,
  watch,
}: GeneralSettingsFormProps) {
  const enableTips = watch('enableTips');

  return (
    <>
      {/* Currency & Language */}
      <Card className="border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <Globe className="w-5 h-5 text-white" />
            </div>
            Configuración Regional
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SelectCustom
              id="currency"
              label="Moneda Principal"
              options={currencyOptions}
              register={register}
              name="currency"
              error={errors.currency}
              required
              placeholder="Seleccionar moneda"
            />

            <SelectCustom
              id="language"
              label="Idioma del Sistema"
              options={languageOptions}
              register={register}
              name="language"
              error={errors.language}
              required
              placeholder="Seleccionar idioma"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SelectCustom
              id="timezone"
              label="Zona Horaria"
              options={timezoneOptions}
              register={register}
              name="timezone"
              error={errors.timezone}
              required
              placeholder="Seleccionar zona horaria"
            />

            <SelectCustom
              id="dateFormat"
              label="Formato de Fecha"
              options={dateFormatOptions}
              register={register}
              name="dateFormat"
              error={errors.dateFormat}
              required
              placeholder="Seleccionar formato"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tax Configuration */}
      <Card className="border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            Configuración de Impuestos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="taxRate">Tasa de Impuesto (IVA) %</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              max="100"
              placeholder="16.00"
              {...register('taxRate', { valueAsNumber: true })}
            />
            {errors.taxRate && (
              <p className="text-sm text-red-600">{errors.taxRate.message}</p>
            )}
            <p className="text-sm text-gray-500">
              Porcentaje de impuesto que se aplicará a los productos
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Tips Configuration */}
      <Card className="border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            Configuración de Propinas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="enableTips"
              {...register('enableTips')}
              className="w-4 h-4 text-cyan-600 bg-gray-100 border-gray-300 rounded focus:ring-cyan-500 focus:ring-2"
            />
            <Label
              htmlFor="enableTips"
              className="text-sm font-medium text-gray-900"
            >
              Habilitar sistema de propinas
            </Label>
          </div>

          {enableTips && (
            <div className="space-y-2">
              <Label htmlFor="defaultTipPercentage">
                Porcentaje de Propina por Defecto %
              </Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                max="100"
                placeholder="10.00"
                {...register('defaultTipPercentage', {
                  valueAsNumber: true,
                })}
              />
              {errors.defaultTipPercentage && (
                <p className="text-sm text-red-600">
                  {errors.defaultTipPercentage.message}
                </p>
              )}
              <p className="text-sm text-gray-500">
                Porcentaje de propina que se sugerirá por defecto
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

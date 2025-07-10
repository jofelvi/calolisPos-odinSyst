import React, { forwardRef } from 'react';
import {
  FieldValues,
  UseFormRegister,
  Path,
  FieldError,
} from 'react-hook-form';
import FormFieldError from '@/components/shared/formFieldError/FormFieldError';
import { AlertCircle, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

interface CustomSelectProps<T extends FieldValues> {
  id: string;
  label?: string;
  options: SelectOption[];
  value?: string | number;
  onChange?: (value: string) => void;
  error?: FieldError | string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  labelClassName?: string;
  selectClassName?: string;
  register?: UseFormRegister<T>;
  name?: Path<T>;
}

const CustomSelectInner = <T extends FieldValues>(
  {
    id,
    label,
    options,
    value,
    onChange,
    error,
    required = false,
    disabled = false,
    placeholder = 'Seleccionar...',
    className = '',
    labelClassName,
    selectClassName = '',
    register,
    name,
    ...props
  }: CustomSelectProps<T>,
  ref: React.Ref<HTMLSelectElement>,
) => {
  const hasError = Boolean(error);
  const registerProps = register && name ? register(name) : null;

  // Generar ID único si no se proporciona
  const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value;

    // Si hay onChange manual, llamarlo
    onChange?.(newValue);

    // Si hay registerProps.onChange (de react-hook-form), llamarlo también
    if (registerProps?.onChange) {
      registerProps.onChange(e);
    }
  };

  const baseClasses = cn(
    // Altura exacta igual al Input (h-11)
    'h-11 w-full rounded-lg border bg-white px-3 py-2 text-sm',
    'transition-all duration-200 ease-in-out',
    'focus:outline-none focus:ring-2 focus:ring-offset-1',
    // Apariencia del select
    'appearance-none cursor-pointer',
    // Disabled state
    'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50',
  );

  const stateClasses = cn(
    // Estados normales
    hasError
      ? ['border-red-500 focus:border-red-500 focus:ring-red-500/20']
      : disabled
        ? ['border-gray-200 bg-gray-50 text-gray-400']
        : ['border-gray-300 focus:border-blue-500 focus:ring-blue-500/20'],
  );

  const labelClasses = cn(
    'block text-sm font-medium mb-2',
    hasError ? 'text-red-700' : 'text-gray-700',
    disabled && 'text-gray-400',
    labelClassName,
  );

  return (
    <div className={cn('space-y-1', className)}>
      {/* Label */}
      {label && (
        <label htmlFor={selectId} className={labelClasses}>
          {label}
          {required && (
            <span className="text-red-500 ml-1" aria-label="Campo requerido">
              *
            </span>
          )}
        </label>
      )}

      {/* Select Container */}
      <div className="relative">
        <select
          id={selectId}
          ref={ref}
          value={value}
          onChange={handleChange}
          disabled={disabled}
          className={cn(
            baseClasses,
            stateClasses,
            // Padding right para el icono
            'pr-10',
            selectClassName,
          )}
          aria-invalid={hasError}
          aria-describedby={hasError ? `${selectId}-error` : undefined}
          {...(registerProps && {
            name: registerProps.name,
            onBlur: registerProps.onBlur,
            ref: registerProps.ref,
          })}
          {...props}
        >
          <option value="" disabled className="text-gray-400">
            {placeholder}
          </option>
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
              className={option.disabled ? 'text-gray-400' : ''}
            >
              {option.label}
            </option>
          ))}
        </select>

        {/* Chevron Icon */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          {hasError ? (
            <AlertCircle className="w-4 h-4 text-red-500" />
          ) : (
            <ChevronDown
              className={cn(
                'w-4 h-4 transition-colors duration-200',
                disabled ? 'text-gray-300' : 'text-gray-400',
              )}
            />
          )}
        </div>
      </div>

      {/* Error Message */}
      {hasError && (
        <div id={`${selectId}-error`}>
          <FormFieldError error={error} />
        </div>
      )}
    </div>
  );
};

const SelectCustom = forwardRef(CustomSelectInner) as <T extends FieldValues>(
  props: CustomSelectProps<T> & { ref?: React.Ref<HTMLSelectElement> },
) => ReturnType<typeof CustomSelectInner>;

export default SelectCustom;

import * as React from 'react';
import { cn } from '@/shared/utils/utils';
import { FieldError } from 'react-hook-form';
import FormFieldError from '@/shared/ui/formFieldError/FormFieldError';
import { AlertCircle } from 'lucide-react';

export interface TextareaWithErrorProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: FieldError | string;
  label?: string;
  textHelper?: string;
  required?: boolean;
}

const TextareaWithError = React.forwardRef<
  HTMLTextAreaElement,
  TextareaWithErrorProps
>(
  (
    {
      className,
      error,
      label,
      textHelper,
      required = false,
      id,
      disabled,
      ...props
    },
    ref,
  ) => {
    const hasError = Boolean(error);

    // Generar ID único si no se proporciona
    const textareaId =
      id || `textarea-${Math.random().toString(36).substr(2, 9)}`;

    const baseClasses = cn(
      'flex min-h-[80px] w-full rounded-xl border bg-white/90 backdrop-blur-sm px-3 py-2 text-sm shadow-sm',
      'placeholder:text-cyan-400/60',
      'focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 focus:bg-white',
      'disabled:cursor-not-allowed disabled:opacity-50',
      'transition-all duration-200 ease-in-out',
      'border-cyan-200',
      hasError && 'border-red-300 focus:border-red-500 focus:ring-red-500/30',
      className,
    );

    const labelClasses = cn(
      'block text-sm font-semibold mb-2',
      hasError ? 'text-red-700' : 'text-cyan-700',
      disabled && 'text-gray-400',
    );

    return (
      <div className="space-y-1">
        {/* Label */}
        {label && (
          <label htmlFor={textareaId} className={labelClasses}>
            {label}
            {required && (
              <span className="text-red-500 ml-1" aria-label="Campo requerido">
                *
              </span>
            )}
          </label>
        )}

        {/* Textarea Container */}
        <div className="relative">
          {/* Textarea Field */}
          <textarea
            id={textareaId}
            className={baseClasses}
            ref={ref}
            disabled={disabled}
            aria-invalid={hasError}
            aria-describedby={cn(
              textHelper && `${textareaId}-helper`,
              error && `${textareaId}-error`,
            )}
            {...props}
          />

          {/* Error Icon */}
          {hasError && (
            <div className="absolute top-2 right-2 pointer-events-none">
              <AlertCircle className="w-4 h-4 text-red-500" />
            </div>
          )}
        </div>

        {/* Helper Text */}
        {textHelper && !hasError && (
          <p
            id={`${textareaId}-helper`}
            className="text-xs text-gray-500 leading-4"
          >
            {textHelper}
          </p>
        )}

        {/* Error Message */}
        {hasError && (
          <div id={`${textareaId}-error`}>
            <FormFieldError error={error} />
          </div>
        )}
      </div>
    );
  },
);

TextareaWithError.displayName = 'TextareaWithError';

export { TextareaWithError };

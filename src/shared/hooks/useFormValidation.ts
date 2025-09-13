// SOLID: Single Responsibility - Form validation logic
// DRY: Reusable validation patterns across all forms
// KISS: Simple validation interface
'use client';
import { useCallback, useState } from 'react';
import * as yup from 'yup';

// SOLID: Interface Segregation - Clear validation interface
export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  firstError: string | null;
}

export interface UseFormValidationOptions<T> {
  schemaYupAction: yup.Schema<T>;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
}

export interface UseFormValidationReturn<T> {
  errors: Record<string, string>;
  isValid: boolean;
  isValidating: boolean;
  validate: (data: T) => Promise<ValidationResult>;
  validateField: (field: keyof T, value: unknown) => Promise<string | null>;
  clearErrors: () => void;
  clearFieldError: (field: keyof T) => void;
  setFieldError: (field: keyof T, error: string) => void;
}

export function useFormValidation<T extends Record<string, unknown>>({
  // @ts-ignore
  schemaYupAction,
}: UseFormValidationOptions<T>): UseFormValidationReturn<T> {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isValidating, setIsValidating] = useState(false);

  // SOLID: Single Responsibility - Validation logic
  const validate = useCallback(
    async (data: T): Promise<ValidationResult> => {
      setIsValidating(true);

      try {
        await schemaYupAction.validate(data, { abortEarly: false });
        setErrors({});
        setIsValidating(false);

        return {
          isValid: true,
          errors: {},
          firstError: null,
        };
      } catch (validationError) {
        if (validationError instanceof yup.ValidationError) {
          const validationErrors: Record<string, string> = {};

          validationError.inner.forEach((error) => {
            if (error.path) {
              validationErrors[error.path] = error.message;
            }
          });

          setErrors(validationErrors);
          setIsValidating(false);

          return {
            isValid: false,
            errors: validationErrors,
            firstError:
              validationError.inner[0]?.message || 'Error de validación',
          };
        }

        setIsValidating(false);
        return {
          isValid: false,
          errors: { general: 'Error de validación' },
          firstError: 'Error de validación',
        };
      }
    },
    [schemaYupAction],
  );

  // SOLID: Single Responsibility - Field-level validation
  const validateField = useCallback(
    async (field: keyof T, value: unknown): Promise<string | null> => {
      try {
        await schemaYupAction.validateAt(field as string, { [field]: value });
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[field as string];
          return newErrors;
        });
        return null;
      } catch (validationError) {
        if (validationError instanceof yup.ValidationError) {
          const errorMessage = validationError.message;
          setErrors((prev) => ({
            ...prev,
            [field as string]: errorMessage,
          }));
          return errorMessage;
        }
        return 'Error de validación';
      }
    },
    [schemaYupAction],
  );

  // DRY: Utility functions for error management
  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  const clearFieldError = useCallback((field: keyof T) => {
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field as string];
      return newErrors;
    });
  }, []);

  const setFieldError = useCallback((field: keyof T, error: string) => {
    setErrors((prev) => ({
      ...prev,
      [field as string]: error,
    }));
  }, []);

  const isValid = Object.keys(errors).length === 0;

  return {
    errors,
    isValid,
    isValidating,
    validate,
    validateField,
    clearErrors,
    clearFieldError,
    setFieldError,
  };
}

export const validationPatterns = {
  required: (fieldName: string) =>
    yup.string().required(`${fieldName} es obligatorio`),

  email: () => yup.string().email('Formato de email inválido'),

  phone: () =>
    yup
      .string()
      .matches(/^[\+]?[1-9][\d]{0,15}$/, 'Formato de teléfono inválido'),

  positiveNumber: (fieldName: string) =>
    yup
      .number()
      .min(0, `${fieldName} debe ser un número positivo`)
      .required(`${fieldName} es obligatorio`),

  currency: (fieldName: string) =>
    yup
      .number()
      .min(0, `${fieldName} debe ser mayor a 0`)
      .required(`${fieldName} es obligatorio`),

  minLength: (min: number) =>
    yup.string().min(min, `Debe tener al menos ${min} caracteres`),

  maxLength: (max: number) =>
    yup.string().max(max, `No puede exceder ${max} caracteres`),
};

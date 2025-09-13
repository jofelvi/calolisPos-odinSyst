// SOLID: Single Responsibility - Form state management
// DRY: Reusable form state logic
// KISS: Simple form state interface
'use client';
import { useCallback, useState } from 'react';

// SOLID: Interface Segregation - Form state interface
export interface FormState<T> {
  data: T;
  isDirty: boolean;
  isSubmitting: boolean;
  hasChanges: boolean;
}

export interface UseFormStateOptions<T> {
  initialData: T;
  onSubmitAction: (data: T) => Promise<void> | void;
  onSuccess?: (data: T) => void;
  onError?: (error: unknown) => void;
  resetOnSuccess?: boolean;
}

export interface UseFormStateReturn<T> {
  // State
  data: T;
  isDirty: boolean;
  isSubmitting: boolean;
  hasChanges: boolean;

  // Actions
  setData: (data: T) => void;
  setField: <K extends keyof T>(field: K, value: T[K]) => void;
  updateField: <K extends keyof T>(
    field: K,
    updater: (current: T[K]) => T[K],
  ) => void;
  reset: () => void;
  submit: () => Promise<void>;

  // Utilities
  getFieldValue: <K extends keyof T>(field: K) => T[K];
  hasFieldChanged: <K extends keyof T>(field: K) => boolean;
}

// KISS: Simple form state management
export function useFormState<T extends Record<string, unknown>>({
  initialData,
  onSubmitAction,
  onSuccess,
  onError,
  resetOnSuccess = false,
}: UseFormStateOptions<T>): UseFormStateReturn<T> {
  const [data, setDataState] = useState<T>(initialData);
  const [originalData] = useState<T>(initialData);
  const [isDirty, setIsDirty] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // SOLID: Single Responsibility - Data mutation
  const setData = useCallback((newData: T) => {
    setDataState(newData);
    setIsDirty(true);
  }, []);

  const setField = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    setDataState((prev) => ({
      ...prev,
      [field]: value,
    }));
    setIsDirty(true);
  }, []);

  const updateField = useCallback(
    <K extends keyof T>(field: K, updater: (current: T[K]) => T[K]) => {
      setDataState((prev) => ({
        ...prev,
        [field]: updater(prev[field]),
      }));
      setIsDirty(true);
    },
    [],
  );

  // DRY: Utility functions
  const getFieldValue = useCallback(
    <K extends keyof T>(field: K): T[K] => {
      return data[field];
    },
    [data],
  );

  const hasFieldChanged = useCallback(
    <K extends keyof T>(field: K): boolean => {
      return data[field] !== originalData[field];
    },
    [data, originalData],
  );

  const hasChanges = Object.keys(data).some(
    (key) => data[key] !== originalData[key],
  );

  // SOLID: Single Responsibility - Form reset
  const reset = useCallback(() => {
    setDataState(initialData);
    setIsDirty(false);
  }, [initialData]);

  // SOLID: Single Responsibility - Form submission
  const submit = useCallback(async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      await onSubmitAction(data);

      if (resetOnSuccess) {
        reset();
      } else {
        setIsDirty(false);
      }

      onSuccess?.(data);
    } catch (error) {
      onError?.(error);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    data,
    isSubmitting,
    onSubmitAction,
    onSuccess,
    onError,
    reset,
    resetOnSuccess,
  ]);

  return {
    // State
    data,
    isDirty,
    isSubmitting,
    hasChanges,

    // Actions
    setData,
    setField,
    updateField,
    reset,
    submit,

    // Utilities
    getFieldValue,
    hasFieldChanged,
  };
}

// DRY: Form state utilities
export const formStateUtils = {
  // Create initial data with type safety
  createInitialData: <T extends Record<string, unknown>>(
    schema: Partial<T>,
  ): T => {
    return schema as T;
  },

  // Compare two objects for changes
  hasDataChanged: <T extends Record<string, unknown>>(
    current: T,
    original: T,
  ): boolean => {
    return Object.keys(current).some((key) => current[key] !== original[key]);
  },

  // Get changed fields only
  getChangedFields: <T extends Record<string, unknown>>(
    current: T,
    original: T,
  ): Partial<T> => {
    const changes: Partial<T> = {};

    Object.keys(current).forEach((key) => {
      if (current[key] !== original[key]) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        changes[key as keyof T] = current[key];
      }
    });

    return changes;
  },
};

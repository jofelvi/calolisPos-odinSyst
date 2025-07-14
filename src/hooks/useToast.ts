'use client';

import { useState, useCallback } from 'react';
import { ToastProps, ToastType } from '@/components/shared/toast/Toast';

interface ToastOptions {
  title?: string;
  message: string;
  type: ToastType;
  duration?: number;
}

export const useToast = () => {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const addToast = useCallback((options: ToastOptions) => {
    const id = Math.random().toString(36).substring(2, 9);
    const toast: ToastProps = {
      id,
      onClose: removeToast,
      duration: 5000,
      ...options,
    };

    setToasts((prev) => [...prev, toast]);
    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const success = useCallback(
    (message: string, title?: string, duration?: number) => {
      return addToast({ type: 'success', message, title, duration });
    },
    [addToast],
  );

  const error = useCallback(
    (message: string, title?: string, duration?: number) => {
      return addToast({ type: 'error', message, title, duration });
    },
    [addToast],
  );

  const warning = useCallback(
    (message: string, title?: string, duration?: number) => {
      return addToast({ type: 'warning', message, title, duration });
    },
    [addToast],
  );

  const info = useCallback(
    (message: string, title?: string, duration?: number) => {
      return addToast({ type: 'info', message, title, duration });
    },
    [addToast],
  );

  const clearAll = useCallback(() => {
    setToasts([]);
  }, []);

  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info,
    clearAll,
  };
};

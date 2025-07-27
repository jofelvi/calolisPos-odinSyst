import { toast } from 'react-hot-toast';
import CustomToaster from '@/shared/ui/toast/customToaster';

type ToastVariant = 'success' | 'error' | 'warning' | 'information';

interface ToastOptions {
  title?: string;
  description?: string;
  duration?: number;
}

export const useToast = () => {
  const showToast = (variant: ToastVariant, options: ToastOptions = {}) => {
    const { title = '', description = '', duration = 5000 } = options;

    return toast.custom(
      (t) => (
        <CustomToaster
          variant={variant}
          title={title}
          description={description}
          isVisible={t.visible}
        />
      ),
      {
        duration,
        position: 'top-right',
        style: {
          zIndex: 9999,
        },
      },
    );
  };

  return {
    success: (options?: ToastOptions) =>
      showToast('success', { duration: 4000, ...options }),
    error: (options?: ToastOptions) =>
      showToast('error', { duration: 6000, ...options }),
    warning: (options?: ToastOptions) =>
      showToast('warning', { duration: 5000, ...options }),
    info: (options?: ToastOptions) =>
      showToast('information', { duration: 4000, ...options }),
  };
};

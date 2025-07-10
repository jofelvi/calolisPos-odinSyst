import { toast } from 'react-hot-toast';
import CustomToaster from '@/components/shared/toast/customToaster';

type ToastVariant = 'success' | 'error' | 'warning' | 'information';

interface ToastOptions {
  title?: string;
  description?: string;
  duration?: number;
}

export const useToast = () => {
  const showToast = (variant: ToastVariant, options: ToastOptions = {}) => {
    const { title = '', description = '', duration = 4000 } = options;

    return toast.custom(
      (t) => (
        <CustomToaster
          variant={variant}
          title={title}
          description={description}
          isVisible={t.visible}
        />
      ),
      { duration },
    );
  };

  return {
    success: (options?: ToastOptions) => showToast('success', options),
    error: (options?: ToastOptions) => showToast('error', options),
    warning: (options?: ToastOptions) => showToast('warning', options),
    info: (options?: ToastOptions) => showToast('information', options),
  };
};

import { cn } from '@/lib/utils';
import { forwardRef } from 'react';
import { FiLoader } from 'react-icons/fi';

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
};

const baseClasses =
  'inline-flex items-center justify-center rounded-md font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';

// Estilo actualizado para parecerse a Material UI
const variantClasses: Record<NonNullable<ButtonProps['variant']>, string> = {
  default: 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg',
  outline: 'border border-blue-600 text-blue-600 hover:bg-blue-50',
  ghost: 'text-gray-700 hover:bg-gray-100',
  destructive: 'bg-red-600 text-white hover:bg-red-700 shadow-md',
};

// Ajustes de tamaño para Material UI
const sizeClasses: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'h-8 px-3 text-sm rounded',
  md: 'h-10 px-5 py-2 text-base rounded-md',
  lg: 'h-12 px-7 py-3 text-lg rounded-lg',
};

// Clases para iconos según tamaño
const iconSizeClasses: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'default',
      size = 'md',
      isLoading = false,
      startIcon,
      endIcon,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    // Determinar si debemos mostrar iconos
    const showStartIcon = !isLoading && startIcon;
    const showEndIcon = !isLoading && endIcon;

    return (
      <button
        ref={ref}
        className={cn(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          'transition-transform active:scale-[0.98]', // Efecto de pulsación
          className,
        )}
        disabled={isLoading || disabled}
        {...props}
      >
        {isLoading && (
          <FiLoader
            className={cn('animate-spin mr-2', iconSizeClasses[size])}
          />
        )}

        {showStartIcon && (
          <span className={cn('mr-2', iconSizeClasses[size])}>{startIcon}</span>
        )}

        {children}

        {showEndIcon && (
          <span className={cn('ml-2', iconSizeClasses[size])}>{endIcon}</span>
        )}
      </button>
    );
  },
);

Button.displayName = 'Button';

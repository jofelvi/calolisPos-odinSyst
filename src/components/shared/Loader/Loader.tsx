import React from 'react';
import { FiLoader } from 'react-icons/fi';
import { cn } from '@/lib/utils'; // Asegúrate de tener esta utilidad

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'default';
  text?: string;
  textPosition?: 'top' | 'bottom' | 'right' | 'left';
  className?: string;
  fullScreen?: boolean;
}

const Loader: React.FC<LoaderProps> = ({
  size = 'lg',
  color = 'primary',
  text = 'Cargando...',
  textPosition = 'bottom',
  className,
  fullScreen = true,
}) => {
  // Mapeo de tamaños
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
    full: 'h-24 w-24',
  };

  // Mapeo de colores
  const colorClasses = {
    primary: 'text-blue-600',
    secondary: 'text-purple-600',
    success: 'text-green-600',
    warning: 'text-yellow-600',
    error: 'text-red-600',
    default: 'text-gray-600',
  };

  // Tamaños de texto correspondientes
  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg',
    full: 'text-xl',
  };

  // Dirección del contenido
  const flexDirection = {
    top: 'flex-col-reverse',
    bottom: 'flex-col',
    left: 'flex-row-reverse',
    right: 'flex-row',
  };

  const spinner = (
    <FiLoader
      className={cn('animate-spin', sizeClasses[size], colorClasses[color])}
    />
  );

  const content = (
    <div
      className={cn(
        'flex items-center justify-center',
        flexDirection[textPosition],
        text ? 'gap-2' : '',
        className,
      )}
    >
      {spinner}
      {text && (
        <span
          className={cn('text-gray-700 font-medium', textSizeClasses[size])}
        >
          {text}
        </span>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-80 flex items-center justify-center z-50">
        {content}
      </div>
    );
  }

  return content;
};

export default Loader;

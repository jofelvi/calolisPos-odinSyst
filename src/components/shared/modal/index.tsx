/* eslint-disable @typescript-eslint/no-unsafe-call */
'use client';
import { createPortal } from 'react-dom';
import React, { useEffect } from 'react';
import { cn } from '@/lib/utils';

interface ModalProps {
  isOpen: boolean;
  children: React.ReactNode;
  className?: string;
  classNameWrap?: string;
  variant?: 'light' | 'dark';
  onClose?: () => void;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  children,
  className,
  classNameWrap,
  variant = 'light',
  onClose,
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }

    // Cleanup al desmontar
    return () => {
      document.body.classList.remove('overflow-hidden');
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Estilos del backdrop con efectos modernos
  const backdropVariants = {
    light: 'bg-black/30 backdrop-blur-md',
    dark: 'bg-black/50 backdrop-blur-lg',
  };

  const mergeClassName = cn(
    // Base styles con glassmorphism
    'bg-white/95 backdrop-blur-xl rounded-2xl relative max-w-md w-full mx-4',
    // Sombra con acentos cyan
    'shadow-2xl shadow-cyan-500/10',
    // Borde con gradiente sutil
    'border border-cyan-100/50',
    // Animación y transición
    'transform transition-all duration-300 ease-out',
    'animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-4',
    // Layout flexible
    'flex flex-col',
    // Altura mínima más moderada
    'min-h-[200px] max-h-[90vh]',
    className,
  );

  const mergeClassNameWrap = cn(
    // Posicionamiento y z-index
    'fixed inset-0 z-50',
    // Centrado perfecto
    'flex items-center justify-center',
    // Padding para mobile
    'p-4',
    // Animación del backdrop
    'animate-in fade-in-0 duration-300',
    classNameWrap,
  );

  return (
    <>
      {createPortal(
        <div className={mergeClassNameWrap}>
          {/* Backdrop con mejor styling */}
          <div
            role="button"
            tabIndex={0}
            className={cn(
              'absolute inset-0 transition-all duration-300',
              backdropVariants[variant],
            )}
            onClick={onClose}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                onClose?.();
              }
            }}
            aria-label="Cerrar modal"
          />

          {/* Modal content con animación */}
          <div
            className={mergeClassName}
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </div>
        </div>,
        document.body,
      )}
    </>
  );
};

export default Modal;

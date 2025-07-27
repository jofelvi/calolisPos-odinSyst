import * as React from 'react';
import { cn } from '@/shared/utils/utils';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Additional className to apply to the textarea */
  className?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-[80px] w-full rounded-xl border border-cyan-200 bg-white/90 backdrop-blur-sm px-3 py-2 text-sm shadow-sm',
          'placeholder:text-cyan-400/60',
          'focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 focus:bg-white',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'transition-all duration-200 ease-in-out',
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Textarea.displayName = 'Textarea';

export { Textarea };

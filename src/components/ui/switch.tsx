import * as React from 'react';
import { cn } from '@/lib/utils';

export interface SwitchProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label?: string;
  onCheckedChange?: (checked: boolean) => void;
}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, label, onCheckedChange, checked, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onCheckedChange?.(e.target.checked);
    };

    return (
      <label className="flex items-center space-x-2 cursor-pointer">
        <div className="relative">
          <input 
            type="checkbox" 
            className="sr-only peer" 
            ref={ref} 
            checked={checked}
            onChange={handleChange}
            {...props} 
          />
          <div
            className={cn(
              'w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-cyan-300 rounded-full peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[""] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600',
              className,
            )}
          />
        </div>
        {label && (
          <span className="text-sm font-medium text-gray-700">{label}</span>
        )}
      </label>
    );
  },
);
Switch.displayName = 'Switch';

export { Switch };

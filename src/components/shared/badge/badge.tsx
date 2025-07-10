import { cn } from '@/lib/utils';

export type BadgeVariant =
  | 'default'
  | 'secondary'
  | 'destructive'
  | 'outline'
  | 'success'
  | 'warning' // Para estados como 'preparing' o 'cleaning'
  | 'info';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  children: React.ReactNode;
}

export function Badge({
  variant = 'default',
  className,
  children,
  ...props
}: BadgeProps) {
  const baseClasses =
    'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2';

  const variantClasses: Record<BadgeVariant, string> = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/80',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    destructive:
      'bg-destructive text-destructive-foreground hover:bg-destructive/80', // Rojo para errores o estados críticos
    outline: 'text-foreground border border-input',
    success: 'bg-green-100 text-green-800 hover:bg-green-100/80', // Verde para estados activos/positivos (e.g., ISAVAILABLE)
    warning: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100/80', // Amarillo para advertencias o estados intermedios (e.g., PREPARING, CLEANING)
    info: 'bg-blue-100 text-blue-800 hover:bg-blue-100/80', // Azul para información o estados como 'RESERVED'
  };

  return (
    <span
      className={cn(baseClasses, variantClasses[variant], className)}
      {...props}
    >
      {children}
    </span>
  );
}

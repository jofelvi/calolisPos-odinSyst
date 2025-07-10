import { cn } from '@/lib/utils'; // Necesitarás esta función de utilidad (ver más abajo)

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-gray-200 dark:bg-gray-800',
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };

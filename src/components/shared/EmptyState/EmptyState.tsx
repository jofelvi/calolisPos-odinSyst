// features/shared/EmptyState.tsx
import { FiPackage } from 'react-icons/fi';
import Link from 'next/link';
import { Button } from '@/components/shared/button/Button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel: string;
  actionHref: string;
  actionIcon?: React.ReactNode;
}

export const EmptyState = ({
  icon = <FiPackage className="w-12 h-12 text-gray-400" />,
  title,
  description,
  actionLabel,
  actionHref,
  actionIcon,
}: EmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-6 max-w-md">{description}</p>
      <Link href={actionHref}>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
          {actionIcon && <span className="mr-2">{actionIcon}</span>}
          {actionLabel}
        </Button>
      </Link>
    </div>
  );
};

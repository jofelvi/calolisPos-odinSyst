import { PurchaseOrderStatusEnum } from '@/types/enumShared';

export function getStatusBadgeClasses(status: PurchaseOrderStatusEnum): string {
  const baseClasses =
    'inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2';
  switch (status) {
    case PurchaseOrderStatusEnum.PENDING:
      return `${baseClasses} bg-amber-100 text-amber-600 dark:bg-amber-900 dark:text-amber-200`;
    case PurchaseOrderStatusEnum.APPROVED:
      return `${baseClasses} bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-200`;
    case PurchaseOrderStatusEnum.RECEIVED:
      return `${baseClasses} bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-200`;
    case PurchaseOrderStatusEnum.PARTIALLY_RECEIVED:
      return `${baseClasses} bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-200`;
    case PurchaseOrderStatusEnum.CANCELED:
      return `${baseClasses} bg-red-100 text-red-600 dark:bg-red-900 dark:red-rose-200`;
    default:
      return `${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200`;
  }
}

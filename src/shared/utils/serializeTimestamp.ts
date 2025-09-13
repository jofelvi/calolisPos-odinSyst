import { formatDate } from '@/shared/utils/dateHelpers';

/**
 * @deprecated Use formatDate from dateHelpers instead
 * Kept for backward compatibility
 */
export const formatDateForDisplay = (dateValue: any): string => {
  return formatDate(dateValue);
};

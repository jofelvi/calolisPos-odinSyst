import { formatDate } from '@/utils/dateHelpers';

/**
 * @deprecated Use formatDate from dateHelpers instead
 * Kept for backward compatibility
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const formatDateForDisplay = (dateValue: any): string => {
  return formatDate(dateValue);
};

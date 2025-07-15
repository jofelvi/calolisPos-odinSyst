import { formatDate, type FirebaseDateValue } from '@/utils/dateHelpers';

/**
 * @deprecated Use formatDate from dateHelpers instead
 * Kept for backward compatibility
 */
export const formatDateForDisplay = (dateValue: FirebaseDateValue): string => {
  return formatDate(dateValue);
};

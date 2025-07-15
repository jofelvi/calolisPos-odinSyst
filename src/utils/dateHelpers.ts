// utils/dateHelpers.ts

/**
 * Convierte cualquier tipo de fecha de Firebase a un objeto Date
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function convertFirebaseDate(date: any): Date {
  if (!date) return new Date();

  // Si es un Timestamp de Firebase
  if (date && typeof date.toDate === 'function') {
    return date.toDate();
  }

  // Si es un objeto Date válido
  if (date instanceof Date) {
    return date;
  }

  // Si es un string o número, intentar convertir
  const converted = new Date(date);
  if (!isNaN(converted.getTime())) {
    return converted;
  }

  // Fallback: fecha actual
  console.warn('No se pudo convertir la fecha, usando fecha actual:', date);
  return new Date();
}

/**
 * Formatea una fecha en formato español
 */
export function formatDate(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  date: any,
  options: Intl.DateTimeFormatOptions = {},
): string {
  const convertedDate = convertFirebaseDate(date);

  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options,
  };

  return convertedDate.toLocaleDateString('es-ES', defaultOptions);
}

/**
 * Formatea solo la hora
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function formatTime(date: any): string {
  const convertedDate = convertFirebaseDate(date);

  return convertedDate.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Formatea fecha y hora completas
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function formatDateTime(date: any): string {
  const convertedDate = convertFirebaseDate(date);

  return convertedDate.toLocaleString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Obtiene tiempo relativo (hace X minutos/horas/días)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getRelativeTime(date: any): string {
  const convertedDate = convertFirebaseDate(date);
  const now = new Date();
  const diffInMinutes = Math.floor(
    (now.getTime() - convertedDate.getTime()) / (1000 * 60),
  );

  if (diffInMinutes < 1) return 'Hace un momento';
  if (diffInMinutes < 60) return `Hace ${diffInMinutes} min`;
  if (diffInMinutes < 1440) {
    const hours = Math.floor(diffInMinutes / 60);
    return `Hace ${hours} hora${hours > 1 ? 's' : ''}`;
  }

  const days = Math.floor(diffInMinutes / 1440);
  return `Hace ${days} día${days > 1 ? 's' : ''}`;
}

/**
 * Convierte fecha a timestamp para comparaciones
 */
export function getTimeValue(timeString: string): number {
  if (timeString.includes('momento')) return 0;
  if (timeString.includes('min'))
    return parseInt(timeString.match(/\d+/)?.[0] || '0');
  if (timeString.includes('hora'))
    return parseInt(timeString.match(/\d+/)?.[0] || '0') * 60;
  if (timeString.includes('día'))
    return parseInt(timeString.match(/\d+/)?.[0] || '0') * 1440;
  return 0;
}

/**
 * Verifica si una fecha está vencida
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isOverdue(date: any): boolean {
  const convertedDate = convertFirebaseDate(date);
  return convertedDate < new Date();
}

/**
 * Formatea fecha para inputs (YYYY-MM-DD)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function formatDateForInput(date: any): string {
  const convertedDate = convertFirebaseDate(date);
  return convertedDate.toISOString().split('T')[0];
}

/**
 * Obtiene el inicio del día para comparaciones
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getStartOfDay(date: any): Date {
  const convertedDate = convertFirebaseDate(date);
  const startOfDay = new Date(convertedDate);
  startOfDay.setHours(0, 0, 0, 0);
  return startOfDay;
}

/**
 * Obtiene el final del día para comparaciones
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getEndOfDay(date: any): Date {
  const convertedDate = convertFirebaseDate(date);
  const endOfDay = new Date(convertedDate);
  endOfDay.setHours(23, 59, 59, 999);
  return endOfDay;
}

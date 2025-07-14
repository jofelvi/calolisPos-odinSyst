// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const formatDateForDisplay = (dateValue: any): string => {
  if (!dateValue) return 'No especificada';

  try {
    let date: Date;

    // Manejar Firestore Timestamp
    if (dateValue && typeof dateValue === 'object' && 'seconds' in dateValue) {
      // Convertir timestamp de Firestore a Date
      date = new Date(dateValue.seconds * 1000);
    } /* else if (typeof dateValue === 'string') {
            date = new Date(dateValue);
        }*/ else if (dateValue instanceof Date) {
      date = dateValue;
    } else {
      return 'No especificada';
    }

    // Verificar si la fecha es válida
    if (isNaN(date.getTime())) {
      return 'Fecha inválida';
    }

    // Formatear la fecha en formato legible (DD/MM/YYYY)
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return 'Fecha inválida';
  }
};

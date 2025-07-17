import { Attendance } from '@/types/attendance';
import { getEmployeeAttendanceByDate } from '@/services/firebase/genericServices';

export interface TodayAttendanceResult {
  readonly attendances: Attendance[];
  readonly canCheckIn: boolean;
  readonly canCheckOut: boolean;
  readonly hasActiveCheckIn: boolean;
  readonly inconsistenciesFound: string[];
  readonly lastValidCheckIn: Date | null;
  readonly lastValidCheckOut: Date | null;
}

export class SimpleAttendanceManager {
  /**
   * Obtiene y valida la asistencia de hoy usando el servicio existente
   * Principio KISS: Simple y directo, sin queries complejas
   */
  static async getTodayAttendanceStatus(
    employeeId: string,
  ): Promise<TodayAttendanceResult> {
    const today = new Date();
    const inconsistencies: string[] = [];

    try {
      // Usar el servicio existente que ya funciona
      const todayAttendance = await getEmployeeAttendanceByDate(
        employeeId,
        today,
      );

      // Si no hay asistencia hoy, permitir check-in
      if (!todayAttendance) {
        return {
          attendances: [],
          canCheckIn: true,
          canCheckOut: false,
          hasActiveCheckIn: false,
          inconsistenciesFound: [],
          lastValidCheckIn: null,
          lastValidCheckOut: null,
        };
      }

      // Validar datos del registro
      const validation = this.validateAttendanceData(todayAttendance);

      return {
        attendances: [todayAttendance],
        canCheckIn: validation.canCheckIn,
        canCheckOut: validation.canCheckOut,
        hasActiveCheckIn: validation.hasActiveCheckIn,
        inconsistenciesFound: validation.inconsistencies,
        lastValidCheckIn: validation.lastValidCheckIn,
        lastValidCheckOut: validation.lastValidCheckOut,
      };
    } catch (error) {
      console.error('❌ Error getting attendance status:', error);

      // En caso de error, asumir que puede hacer check-in
      return {
        attendances: [],
        canCheckIn: true,
        canCheckOut: false,
        hasActiveCheckIn: false,
        inconsistenciesFound: [`Error al obtener datos: ${error}`],
        lastValidCheckIn: null,
        lastValidCheckOut: null,
      };
    }
  }

  /**
   * Valida los datos de asistencia y determina acciones disponibles
   * Principio SRP: Una sola responsabilidad
   */
  private static validateAttendanceData(attendance: Attendance): {
    canCheckIn: boolean;
    canCheckOut: boolean;
    hasActiveCheckIn: boolean;
    inconsistencies: string[];
    lastValidCheckIn: Date | null;
    lastValidCheckOut: Date | null;
  } {
    const inconsistencies: string[] = [];
    let lastValidCheckIn: Date | null = null;
    let lastValidCheckOut: Date | null = null;

    // Validar check-in
    const hasValidCheckIn = this.isValidTimestamp(attendance.checkIn);
    if (hasValidCheckIn) {
      lastValidCheckIn = new Date(attendance.checkIn!);
    } else if (attendance.checkIn) {
      inconsistencies.push('Check-in con timestamp inválido');
    }

    // Validar check-out
    const hasValidCheckOut = this.isValidTimestamp(attendance.checkOut);
    if (hasValidCheckOut) {
      lastValidCheckOut = new Date(attendance.checkOut!);
    } else if (attendance.checkOut) {
      inconsistencies.push('Check-out con timestamp inválido');
    }

    // Validar lógica de negocio
    if (hasValidCheckIn && hasValidCheckOut) {
      const checkInTime = new Date(attendance.checkIn!);
      const checkOutTime = new Date(attendance.checkOut!);

      if (checkOutTime <= checkInTime) {
        inconsistencies.push('Check-out anterior al check-in');
        // Tratar como si no hubiera check-out válido
        lastValidCheckOut = null;
      }
    }

    // Detectar checkout fantasma
    if (hasValidCheckOut && !hasValidCheckIn) {
      inconsistencies.push(
        'Check-out sin check-in correspondiente (dato fantasma)',
      );
    }

    // Determinar acciones disponibles
    const canCheckIn =
      !hasValidCheckIn || (hasValidCheckIn && hasValidCheckOut);
    const canCheckOut = hasValidCheckIn && !hasValidCheckOut;
    const hasActiveCheckIn = hasValidCheckIn && !hasValidCheckOut;

    return {
      canCheckIn,
      canCheckOut,
      hasActiveCheckIn,
      inconsistencies,
      lastValidCheckIn,
      lastValidCheckOut,
    };
  }

  /**
   * Valida si un timestamp es válido
   * Principio SRP: Validación específica
   */
  private static isValidTimestamp(timestamp: any): boolean {
    if (!timestamp) return false;

    try {
      const date = new Date(timestamp);
      return !isNaN(date.getTime()) && date.getFullYear() > 2020;
    } catch {
      return false;
    }
  }

  /**
   * Genera un reporte de debug para troubleshooting
   */
  static generateDebugReport(result: TodayAttendanceResult): object {
    return {
      timestamp: new Date().toISOString(),
      attendanceCount: result.attendances.length,
      canCheckIn: result.canCheckIn,
      canCheckOut: result.canCheckOut,
      hasActiveCheckIn: result.hasActiveCheckIn,
      inconsistenciesFound: result.inconsistenciesFound,
      lastValidCheckIn: result.lastValidCheckIn?.toISOString() || null,
      lastValidCheckOut: result.lastValidCheckOut?.toISOString() || null,
      rawAttendances: result.attendances.map((att) => ({
        id: att.id,
        checkIn: att.checkIn,
        checkOut: att.checkOut,
        date: att.date,
        status: att.status,
        createdAt: att.createdAt,
      })),
    };
  }
}

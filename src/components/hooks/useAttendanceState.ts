import { useEffect, useState } from 'react';
import { Attendance } from '@/types/attendance';
import { getEmployeeAttendanceByPeriod } from '@/services/firebase/genericServices';

interface UseAttendanceStateProps {
  employeeId: string;
  selectedMonth: number;
  selectedYear: number;
}

interface AttendanceState {
  attendances: Attendance[];
  todayAttendance: Attendance | null;
  canCheckOut: boolean;
  loading: boolean;
  error: string | null;
}

export const useAttendanceState = ({
  employeeId,
  selectedMonth,
  selectedYear,
}: UseAttendanceStateProps): AttendanceState & {
  refreshAttendances: () => Promise<void>;
} => {
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getTodayAttendance = (
    attendanceList: Attendance[],
  ): Attendance | null => {
    const today = new Date();
    return (
      attendanceList.find((attendance) => {
        const attendanceDate = new Date(attendance.date);
        return attendanceDate.toDateString() === today.toDateString();
      }) || null
    );
  };

  const canPerformCheckOut = (todayRecord: Attendance | null): boolean => {
    if (!todayRecord) return false;

    // Verificar que tenga checkIn pero NO tenga checkOut
    const hasCheckIn = !!todayRecord.checkIn;
    const hasCheckOut = !!todayRecord.checkOut;

    // Solo puede hacer checkout si tiene checkin pero no checkout
    return hasCheckIn && !hasCheckOut;
  };

  const fetchAttendances = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const startDate = new Date(selectedYear, selectedMonth - 1, 1);
      const endDate = new Date(selectedYear, selectedMonth, 0);

      const fetchedAttendances = await getEmployeeAttendanceByPeriod(
        employeeId,
        startDate,
        endDate,
      );

      // Filtrar registros duplicados o corruptos
      const cleanAttendances = fetchedAttendances.filter((attendance) => {
        // Validar que el registro tenga datos básicos válidos
        return (
          attendance.id &&
          attendance.employeeId === employeeId &&
          attendance.date
        );
      });

      setAttendances(cleanAttendances);
    } catch (err) {
      console.error('Error fetching attendances:', err);
      setError('Error al cargar las asistencias');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (employeeId) {
      fetchAttendances();
    }
  }, [employeeId, selectedMonth, selectedYear]);

  const todayAttendance = getTodayAttendance(attendances);
  const canCheckOut = canPerformCheckOut(todayAttendance);

  return {
    attendances,
    todayAttendance,
    canCheckOut,
    loading,
    error,
    refreshAttendances: fetchAttendances,
  };
};

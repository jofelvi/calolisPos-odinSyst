import { AttendanceStatusEnum } from '@/types/enumShared';

export interface Attendance {
  id: string;
  employeeId: string; // 🔗 relación con Employee
  userId?: string; // 🔗 relación con User (opcional)
  date: Date;
  checkIn?: Date;
  checkOut?: Date;
  breakStart?: Date;
  breakEnd?: Date;
  totalHours: number;
  overtimeHours: number;
  hoursWorked?: number;
  status: AttendanceStatusEnum;
  notes?: string;
  location?: {
    latitude?: number;
    longitude?: number;
    accuracy?: number;
    checkIn?: {
      latitude: number;
      longitude: number;
      accuracy: number;
    };
    checkOut?: {
      latitude: number;
      longitude: number;
      accuracy: number;
    };
  };
  device?: {
    userAgent?: string;
    timestamp?: number;
    ipAddress?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAttendanceData {
  employeeId: string;
  date: Date;
  checkIn?: Date;
  checkOut?: Date;
  breakStart?: Date;
  breakEnd?: Date;
  status: AttendanceStatusEnum;
  notes?: string;
  location?: {
    latitude?: number;
    longitude?: number;
    accuracy?: number;
    checkIn?: {
      latitude: number;
      longitude: number;
      accuracy: number;
    };
    checkOut?: {
      latitude: number;
      longitude: number;
      accuracy: number;
    };
  };
  device?: {
    userAgent?: string;
    timestamp?: number;
    ipAddress?: string;
  };
}

export interface AttendanceReport {
  employeeId: string;
  employeeName: string;
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  totalHours: number;
  overtimeHours: number;
  period: {
    startDate: Date;
    endDate: Date;
  };
}

export interface AttendanceSummary {
  employeeId: string;
  employeeName: string;
  department: string;
  position: string;
  month: number;
  year: number;
  workingDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  earlyDepartures: number;
  holidayDays: number;
  sickLeaveDays: number;
  vacationDays: number;
  totalHours: number;
  regularHours: number;
  overtimeHours: number;
  attendanceRate: number; // percentage
}

export interface DailyAttendance {
  date: Date;
  dayOfWeek: string;
  isWorkingDay: boolean;
  attendance?: Attendance;
  expectedCheckIn?: string; // "09:00"
  expectedCheckOut?: string; // "18:00"
  status: AttendanceStatusEnum;
}

export interface AttendanceSettings {
  workingDays: number[]; // 0-6 (Sunday-Saturday)
  standardWorkHours: number;
  overtimeThreshold: number;
  lateThresholdMinutes: number;
  earlyDepartureThresholdMinutes: number;
  standardCheckIn: string; // "09:00"
  standardCheckOut: string; // "18:00"
  breakDurationMinutes: number;
}

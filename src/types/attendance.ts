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
  status: AttendanceStatusEnum;
  notes?: string;
  location?: string;
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
  location?: string;
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

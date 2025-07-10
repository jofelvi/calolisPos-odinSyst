import { AttendanceStatusEnum } from '@/types/enumShared';

export interface Attendance {
  id: string;
  userId: string; // 🔗 relación con User
  date: Date;
  status: AttendanceStatusEnum;
}

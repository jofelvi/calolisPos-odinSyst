import { PayrollStatusEnum } from '@/types/enumShared';

export interface Payroll {
  id: string;
  employeeId: string;
  period: {
    startDate: Date;
    endDate: Date;
    month: number;
    year: number;
  };
  salary: {
    baseSalary: number;
    overtime: number;
    bonuses: number;
    commissions: number;
  };
  deductions: {
    taxes: number;
    socialSecurity: number;
    insurance: number;
    other: number;
  };
  netPay: number;
  grossPay: number;
  hoursWorked: number;
  overtimeHours: number;
  status: PayrollStatusEnum;
  paymentDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePayrollData {
  employeeId: string;
  period: {
    startDate: Date;
    endDate: Date;
    month: number;
    year: number;
  };
  salary: {
    baseSalary: number;
    overtime?: number;
    bonuses?: number;
    commissions?: number;
  };
  deductions?: {
    taxes?: number;
    socialSecurity?: number;
    insurance?: number;
    other?: number;
  };
  hoursWorked: number;
  overtimeHours?: number;
  notes?: string;
}

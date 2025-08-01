export interface Employee {
  id: string;
  userId?: string; // Relación con User para login
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  position: string;
  department: string;
  hireDate: Date;
  salary: number;
  isActive: boolean;
  pin: string | null; // PIN de seguridad para registro de asistencia
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  bankAccount?: {
    accountNumber: string | null;
    bankName: string | null;
    accountType: string | null;
  } | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateEmployeeData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  position: string;
  department: string;
  hireDate: Date;
  salary: number;
  pin: string | null; // PIN de seguridad para registro de asistencia
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  bankAccount?: {
    accountNumber: string | null;
    bankName: string | null;
    accountType: string | null;
  } | null;
}

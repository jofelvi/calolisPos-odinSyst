import * as yup from 'yup';
import { AttendanceStatusEnum } from '@/types/enumShared';

export const attendanceSchema = yup.object({
  employeeId: yup.string().required('Empleado es requerido'),
  date: yup.date().required('Fecha es requerida'),
  checkIn: yup.date().nullable(),
  checkOut: yup.date().nullable(),
  breakStart: yup.date().nullable(),
  breakEnd: yup.date().nullable(),
  status: yup
    .string()
    .oneOf(Object.values(AttendanceStatusEnum))
    .required('Estado es requerido'),
  notes: yup.string(),
  location: yup.string(),
});

export const attendanceEditSchema = yup.object({
  checkIn: yup.date().nullable(),
  checkOut: yup.date().nullable(),
  breakStart: yup.date().nullable(),
  breakEnd: yup.date().nullable(),
  status: yup
    .string()
    .oneOf(Object.values(AttendanceStatusEnum))
    .required('Estado es requerido'),
  notes: yup.string(),
  location: yup.string(),
});

export const attendanceReportSchema = yup.object({
  employeeId: yup.string().required('Empleado es requerido'),
  startDate: yup.date().required('Fecha de inicio es requerida'),
  endDate: yup
    .date()
    .required('Fecha de fin es requerida')
    .min(yup.ref('startDate'), 'La fecha de fin debe ser posterior a la fecha de inicio'),
});

export type AttendanceFormValues = yup.InferType<typeof attendanceSchema>;
export type AttendanceEditFormValues = yup.InferType<typeof attendanceEditSchema>;
export type AttendanceReportFormValues = yup.InferType<typeof attendanceReportSchema>;
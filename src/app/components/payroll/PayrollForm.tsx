'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Employee } from '@/types/employee';
import { PayrollCalculation } from '@/types/payroll';
import { employeeService } from '@/services/firebase/genericServices';
import { payrollCalculationService } from '@/services/payrollService';
import {
  PayrollCalculationFormValues,
  payrollCalculationSchema,
} from '@/schemas/payrollSchema';
import {
  AlertCircle,
  Calculator,
  CheckCircle,
  Clock,
  DollarSign,
  TrendingUp,
  Users,
} from 'lucide-react';

interface PayrollFormProps {
  onSuccess?: (payrollId: string) => void;
  onCancel?: () => void;
  initialData?: Partial<PayrollCalculationFormValues>;
}

export default function PayrollForm({
  onSuccess,
  onCancel,
  initialData,
}: PayrollFormProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null,
  );
  const [payrollCalculation, setPayrollCalculation] =
    useState<PayrollCalculation | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PayrollCalculationFormValues>({
    resolver: yupResolver(payrollCalculationSchema),
    defaultValues: {
      month: initialData?.month || new Date().getMonth() + 1,
      year: initialData?.year || new Date().getFullYear(),
      includeOvertimePay: initialData?.includeOvertimePay ?? true,
      overtimeRate: initialData?.overtimeRate || 1.5,
      bonuses: initialData?.bonuses || 0,
      commissions: initialData?.commissions || 0,
      additionalDeductions: initialData?.additionalDeductions || 0,
    },
  });

  const watchedEmployeeId = watch('employeeId');
  const watchedMonth = watch('month');
  const watchedYear = watch('year');
  const watchedBonuses = watch('bonuses');
  const watchedCommissions = watch('commissions');
  const watchedAdditionalDeductions = watch('additionalDeductions');

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (watchedEmployeeId) {
      const employee = employees.find((e) => e.id === watchedEmployeeId);
      setSelectedEmployee(employee || null);
      setPayrollCalculation(null);
    }
  }, [watchedEmployeeId, employees]);

  const fetchEmployees = async () => {
    try {
      const allEmployees = await employeeService.getAll();
      const activeEmployees = allEmployees.filter((emp) => emp.isActive);
      setEmployees(activeEmployees);
    } catch (err) {
      console.error('Error fetching employees:', err);
      setError('Error al cargar empleados');
    }
  };

  const calculatePayroll = async () => {
    if (!watchedEmployeeId || !watchedMonth || !watchedYear) {
      setError('Por favor selecciona empleado, mes y año');
      return;
    }

    setIsCalculating(true);
    setError(null);

    try {
      const calculation =
        await payrollCalculationService.calculateEmployeePayroll(
          watchedEmployeeId,
          watchedMonth,
          watchedYear,
          {
            bonuses: watchedBonuses || 0,
            commissions: watchedCommissions || 0,
            additionalDeductions: watchedAdditionalDeductions || 0,
          },
        );

      if (calculation) {
        setPayrollCalculation(calculation);
      } else {
        setError(
          'No se pudo calcular la nómina. Verifica que el empleado tenga registros de asistencia.',
        );
      }
    } catch {
      setError('Error al calcular la nómina');
    } finally {
      setIsCalculating(false);
    }
  };

  const onSubmit = async (data: PayrollCalculationFormValues) => {
    if (!payrollCalculation) {
      setError('Primero debes calcular la nómina');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Actualizar el cálculo con los valores del formulario
      const updatedPayrollCalculation = {
        ...payrollCalculation,
        salary: {
          ...payrollCalculation.salary,
          bonuses: data.bonuses || 0,
          commissions: data.commissions || 0,
        },
        deductions: {
          ...payrollCalculation.deductions,
          other: data.additionalDeductions || 0,
        },
      };

      // Recalcular gross pay y net pay con los nuevos valores
      const newGrossPay =
        updatedPayrollCalculation.salary.baseSalary +
        updatedPayrollCalculation.salary.overtime +
        updatedPayrollCalculation.salary.bonuses +
        updatedPayrollCalculation.salary.commissions;

      const newTotalDeductions =
        updatedPayrollCalculation.deductions.taxes +
        updatedPayrollCalculation.deductions.socialSecurity +
        updatedPayrollCalculation.deductions.insurance +
        updatedPayrollCalculation.deductions.other;

      const finalPayrollCalculation = {
        ...updatedPayrollCalculation,
        grossPay: newGrossPay,
        totalDeductions: newTotalDeductions,
        netPay: newGrossPay - newTotalDeductions,
      };

      const payrollId = await payrollCalculationService.createPayroll(
        finalPayrollCalculation,
      );
      onSuccess?.(payrollId);
    } catch (err) {
      console.error('Error saving payroll:', err);
      setError('Error al guardar la nómina');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-VE', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Calcular Nómina
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="employeeId">Empleado *</Label>
                <Select
                  value={watchedEmployeeId || ''}
                  onValueChange={(value) => setValue('employeeId', value)}
                >
                  <SelectTrigger
                    className={errors.employeeId ? 'border-red-500' : ''}
                  >
                    <SelectValue placeholder="Selecciona un empleado" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        <div className="flex flex-col">
                          <span>
                            {employee.firstName} {employee.lastName}
                          </span>
                          <span className="text-sm text-gray-500">
                            {employee.position}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.employeeId && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.employeeId.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="month">Mes *</Label>
                <Select
                  value={watchedMonth?.toString() || ''}
                  onValueChange={(value) => setValue('month', parseInt(value))}
                >
                  <SelectTrigger
                    className={errors.month ? 'border-red-500' : ''}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => (
                      <SelectItem key={i + 1} value={(i + 1).toString()}>
                        {new Date(0, i).toLocaleDateString('es-ES', {
                          month: 'long',
                        })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.month && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.month.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="year">Año *</Label>
                <Input
                  type="number"
                  {...register('year')}
                  min="2020"
                  max="2030"
                  className={errors.year ? 'border-red-500' : ''}
                />
                {errors.year && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.year.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="overtimeRate">Tasa Horas Extra</Label>
                <Input
                  type="number"
                  step="0.1"
                  {...register('overtimeRate')}
                  className={errors.overtimeRate ? 'border-red-500' : ''}
                />
                {errors.overtimeRate && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.overtimeRate.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="bonuses">Bonificaciones</Label>
                <Input
                  type="number"
                  step="0.01"
                  {...register('bonuses')}
                  placeholder="0.00"
                  className={errors.bonuses ? 'border-red-500' : ''}
                />
                {errors.bonuses && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.bonuses.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="commissions">Comisiones</Label>
                <Input
                  type="number"
                  step="0.01"
                  {...register('commissions')}
                  placeholder="0.00"
                  className={errors.commissions ? 'border-red-500' : ''}
                />
                {errors.commissions && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.commissions.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="additionalDeductions">
                  Deducciones Adicionales
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  {...register('additionalDeductions')}
                  placeholder="0.00"
                  className={
                    errors.additionalDeductions ? 'border-red-500' : ''
                  }
                />
                {errors.additionalDeductions && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.additionalDeductions.message}
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-center">
              <Button
                type="button"
                onClick={calculatePayroll}
                disabled={isCalculating || !watchedEmployeeId}
                className="flex items-center gap-2"
              >
                <Calculator className="h-4 w-4" />
                {isCalculating ? 'Calculando...' : 'Calcular Nómina'}
              </Button>
            </div>

            {selectedEmployee && (
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <Users className="h-8 w-8 text-blue-600" />
                    <div>
                      <h3 className="font-medium">
                        {selectedEmployee.firstName} {selectedEmployee.lastName}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {selectedEmployee.position} -{' '}
                        {selectedEmployee.department}
                      </p>
                      <p className="text-sm text-blue-600">
                        Salario Base: {formatCurrency(selectedEmployee.salary)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {payrollCalculation && (
              <Card className="bg-green-50 border-green-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-800">
                    <CheckCircle className="h-5 w-5" />
                    Cálculo de Nómina
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Attendance Summary */}
                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Resumen de Asistencia
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">
                          {payrollCalculation.attendanceSummary.presentDays}
                        </p>
                        <p className="text-sm text-gray-600">Días Trabajados</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-600">
                          {payrollCalculation.hoursWorked.toFixed(1)}h
                        </p>
                        <p className="text-sm text-gray-600">Horas Totales</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-purple-600">
                          {payrollCalculation.overtimeHours.toFixed(1)}h
                        </p>
                        <p className="text-sm text-gray-600">Horas Extra</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-orange-600">
                          {formatPercentage(
                            payrollCalculation.attendanceSummary.attendanceRate,
                          )}
                        </p>
                        <p className="text-sm text-gray-600">Asistencia</p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Salary Breakdown */}
                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Desglose Salarial
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <h5 className="font-medium text-green-700">Ingresos</h5>
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span className="text-sm">Salario Base:</span>
                            <span className="font-medium">
                              {formatCurrency(
                                payrollCalculation.salary.baseSalary,
                              )}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Horas Extra:</span>
                            <span className="font-medium">
                              {formatCurrency(
                                payrollCalculation.salary.overtime,
                              )}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Bonificaciones:</span>
                            <span className="font-medium">
                              {formatCurrency(
                                payrollCalculation.salary.bonuses,
                              )}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Comisiones:</span>
                            <span className="font-medium">
                              {formatCurrency(
                                payrollCalculation.salary.commissions,
                              )}
                            </span>
                          </div>
                          <Separator />
                          <div className="flex justify-between font-bold text-green-700">
                            <span>Salario Bruto:</span>
                            <span>
                              {formatCurrency(payrollCalculation.grossPay)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h5 className="font-medium text-red-700">
                          Deducciones
                        </h5>
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span className="text-sm">Impuestos:</span>
                            <span className="font-medium">
                              {formatCurrency(
                                payrollCalculation.deductions.taxes,
                              )}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Seguro Social:</span>
                            <span className="font-medium">
                              {formatCurrency(
                                payrollCalculation.deductions.socialSecurity,
                              )}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Seguros:</span>
                            <span className="font-medium">
                              {formatCurrency(
                                payrollCalculation.deductions.insurance,
                              )}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Otras:</span>
                            <span className="font-medium">
                              {formatCurrency(
                                payrollCalculation.deductions.other,
                              )}
                            </span>
                          </div>
                          <Separator />
                          <div className="flex justify-between font-bold text-red-700">
                            <span>Total Deducciones:</span>
                            <span>
                              {formatCurrency(
                                payrollCalculation.totalDeductions,
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Net Pay */}
                  <div className="text-center bg-white rounded-lg p-4 border-2 border-blue-200">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <TrendingUp className="h-6 w-6 text-blue-600" />
                      <h4 className="text-lg font-bold text-blue-800">
                        Salario Neto
                      </h4>
                    </div>
                    <p className="text-3xl font-bold text-blue-600">
                      {formatCurrency(payrollCalculation.netPay)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex justify-end space-x-4">
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancelar
                </Button>
              )}
              <Button
                type="submit"
                disabled={isSubmitting || !payrollCalculation}
                className="flex items-center gap-2"
              >
                {isSubmitting ? 'Guardando...' : 'Guardar Nómina'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

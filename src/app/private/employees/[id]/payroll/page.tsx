'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Employee } from '@/modelTypes/employee';
import { Payroll } from '@/modelTypes/payroll';
import { PayrollStatusEnum } from '@/shared';
import {
  employeeService,
  payrollService,
} from '@/services/firebase/genericServices';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  ClockIcon,
  DollarSignIcon,
  FileTextIcon,
  PlusIcon,
  XCircleIcon,
} from 'lucide-react';

export default function EmployeePayrollPage() {
  const params = useParams();
  const router = useRouter();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    if (params.id) {
      fetchEmployee(params.id as string);
    }
  }, [params.id]);

  useEffect(() => {
    if (employee) {
      fetchPayrolls();
    }
  }, [employee, selectedYear]);

  const fetchEmployee = async (employeeId: string) => {
    try {
      const employeeData = await employeeService.getById(employeeId);
      if (employeeData) {
        setEmployee(employeeData);
      } else {
        setError('Empleado no encontrado');
      }
    } catch {
      setError('Error al cargar empleado');
    }
  };

  const fetchPayrolls = async () => {
    if (!employee) return;

    try {
      setLoading(true);
      // Fetch payrolls for the entire year
      const allPayrolls = await payrollService.getAll();
      const employeePayrolls = allPayrolls.filter(
        (p) => p.employeeId === employee.id && p.period.year === selectedYear,
      );
      setPayrolls(employeePayrolls);
      setError(null);
    } catch {
      setError('Error al cargar nóminas');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.push(`/private/employees/${employee?.id}`);
  };

  const handleCreatePayroll = async (month: number) => {
    if (!employee) return;

    try {
      const year = selectedYear;
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);

      const payrollData = {
        employeeId: employee.id,
        period: {
          startDate,
          endDate,
          month,
          year,
        },
        salary: {
          baseSalary: employee.salary,
          overtime: 0,
          bonuses: 0,
          commissions: 0,
        },
        deductions: {
          taxes: employee.salary * 0.15, // 15% tax
          socialSecurity: employee.salary * 0.12, // 12% social security
          insurance: 50, // Fixed insurance
          other: 0,
        },
        hoursWorked: 160, // Standard 40 hours per week * 4 weeks
        overtimeHours: 0,
        status: PayrollStatusEnum.DRAFT,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Calculate gross pay
      const grossPay =
        payrollData.salary.baseSalary +
        payrollData.salary.overtime +
        payrollData.salary.bonuses +
        payrollData.salary.commissions;

      // Calculate total deductions
      const totalDeductions =
        payrollData.deductions.taxes +
        payrollData.deductions.socialSecurity +
        payrollData.deductions.insurance +
        payrollData.deductions.other;

      // Calculate net pay
      const netPay = grossPay - totalDeductions;

      const finalPayrollData = {
        ...payrollData,
        grossPay,
        netPay,
      };

      await payrollService.create(finalPayrollData);
      await fetchPayrolls();
    } catch {
      setError('Error al crear nómina');
    }
  };

  const getStatusBadge = (status: PayrollStatusEnum) => {
    const statusConfig = {
      [PayrollStatusEnum.DRAFT]: {
        color: 'bg-gray-100 text-gray-800',
        icon: ClockIcon,
      },
      [PayrollStatusEnum.APPROVED]: {
        color: 'bg-blue-100 text-blue-800',
        icon: CheckCircleIcon,
      },
      [PayrollStatusEnum.PAID]: {
        color: 'bg-green-100 text-green-800',
        icon: CheckCircleIcon,
      },
      [PayrollStatusEnum.CANCELLED]: {
        color: 'bg-red-100 text-red-800',
        icon: XCircleIcon,
      },
    };

    const config =
      statusConfig[status] || statusConfig[PayrollStatusEnum.DRAFT];
    const IconComponent = config.icon;

    return (
      <Badge className={`${config.color} border-0`}>
        <IconComponent className="h-3 w-3 mr-1" />
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('es-ES', {
      month: 'long',
      year: 'numeric',
    });
  };

  const getMonthName = (month: number) => {
    return new Date(0, month - 1).toLocaleDateString('es-ES', {
      month: 'long',
    });
  };

  const getPayrollForMonth = (month: number) => {
    return payrolls.find((p) => p.period.month === month);
  };

  const totalPaidThisYear = payrolls
    .filter((p) => p.status === PayrollStatusEnum.PAID)
    .reduce((acc, p) => acc + p.netPay, 0);

  if (loading && !employee) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error && !employee) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">{error}</p>
        <Button onClick={handleBack} className="mt-4">
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Volver
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Nómina</h1>
            <p className="text-gray-600">
              {employee?.firstName} {employee?.lastName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div>
            <Label htmlFor="year">Año</Label>
            <Input
              type="number"
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              min="2020"
              max="2030"
              className="w-20"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Información del Empleado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Salario Base:</span>
                <span className="font-medium">
                  {formatCurrency(employee?.salary || 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Cargo:</span>
                <span className="font-medium">{employee?.position}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Departamento:</span>
                <span className="font-medium">{employee?.department}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Resumen del Año</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">
                  Nóminas procesadas:
                </span>
                <span className="font-medium">{payrolls.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Nóminas pagadas:</span>
                <span className="font-medium">
                  {
                    payrolls.filter((p) => p.status === PayrollStatusEnum.PAID)
                      .length
                  }
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total pagado:</span>
                <span className="font-medium text-green-600">
                  {formatCurrency(totalPaidThisYear)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Última Nómina</CardTitle>
          </CardHeader>
          <CardContent>
            {payrolls.length > 0 ? (
              <div className="space-y-2">
                {(() => {
                  const lastPayroll = payrolls[payrolls.length - 1];
                  return (
                    <>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Período:</span>
                        <span className="font-medium">
                          {formatDate(lastPayroll.period.startDate)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">
                          Pago neto:
                        </span>
                        <span className="font-medium">
                          {formatCurrency(lastPayroll.netPay)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Estado:</span>
                        {getStatusBadge(lastPayroll.status)}
                      </div>
                    </>
                  );
                })()}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                <FileTextIcon className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">No hay nóminas registradas</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nóminas por Mes</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => {
                const payroll = getPayrollForMonth(month);
                return (
                  <Card
                    key={month}
                    className="border-2 border-gray-200 hover:border-blue-300 transition-colors"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold">{getMonthName(month)}</h3>
                        {payroll ? (
                          getStatusBadge(payroll.status)
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleCreatePayroll(month)}
                            className="flex items-center gap-1"
                          >
                            <PlusIcon className="h-3 w-3" />
                            Crear
                          </Button>
                        )}
                      </div>

                      {payroll ? (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Bruto:</span>
                            <span className="font-medium">
                              {formatCurrency(payroll.grossPay)}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Deducciones:</span>
                            <span className="font-medium text-red-600">
                              -
                              {formatCurrency(
                                payroll.grossPay - payroll.netPay,
                              )}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm font-semibold border-t pt-2">
                            <span>Neto:</span>
                            <span className="text-green-600">
                              {formatCurrency(payroll.netPay)}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Horas:</span>
                            <span className="font-medium">
                              {payroll.hoursWorked}h
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-4 text-gray-500">
                          <DollarSignIcon className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                          <p className="text-sm">No procesada</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

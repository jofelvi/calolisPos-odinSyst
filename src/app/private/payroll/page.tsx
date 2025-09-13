'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { Badge } from '@/components/ui/badge';
import { Payroll } from '@/modelTypes/payroll';
import { Employee } from '@/modelTypes/employee';
import { PayrollStatusEnum } from '@/shared';
import {
  employeeService,
  payrollService,
} from '@/services/firebase/genericServices';
import {
  CalendarIcon,
  DollarSignIcon,
  DownloadIcon,
  EyeIcon,
  FilterIcon,
  PlusIcon,
  SearchIcon,
  TrendingUpIcon,
  UserIcon,
  UsersIcon,
} from 'lucide-react';

export default function PayrollPage() {
  const router = useRouter();
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>(
    new Date().getFullYear().toString(),
  );
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [payrollData, employeeData] = await Promise.all([
        payrollService.getAll(),
        employeeService.getAll(),
      ]);

      setPayrolls(payrollData);
      setEmployees(employeeData);
      setError(null);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find((e) => e.id === employeeId);
    return employee
      ? `${employee.firstName} ${employee.lastName}`
      : 'Desconocido';
  };

  const getEmployeeDepartment = (employeeId: string) => {
    const employee = employees.find((e) => e.id === employeeId);
    return employee?.department || 'Sin departamento';
  };

  const getStatusBadge = (status: PayrollStatusEnum) => {
    const statusConfig = {
      [PayrollStatusEnum.DRAFT]: {
        color: 'bg-gray-100 text-gray-800',
        label: 'Borrador',
      },
      [PayrollStatusEnum.APPROVED]: {
        color: 'bg-blue-100 text-blue-800',
        label: 'Aprobado',
      },
      [PayrollStatusEnum.PAID]: {
        color: 'bg-green-100 text-green-800',
        label: 'Pagado',
      },
      [PayrollStatusEnum.CANCELLED]: {
        color: 'bg-red-100 text-red-800',
        label: 'Cancelado',
      },
    };

    const config =
      statusConfig[status] || statusConfig[PayrollStatusEnum.DRAFT];

    return <Badge className={`${config.color} border-0`}>{config.label}</Badge>;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-VE', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatMonthYear = (month: number, year: number) => {
    const monthName = new Date(year, month - 1).toLocaleDateString('es-ES', {
      month: 'long',
    });
    return `${monthName} ${year}`;
  };

  // Filter logic
  const filteredPayrolls = payrolls.filter((payroll) => {
    const employee = employees.find((e) => e.id === payroll.employeeId);
    const employeeName = employee
      ? `${employee.firstName} ${employee.lastName}`.toLowerCase()
      : '';
    const department = employee?.department || '';

    const matchesSearch =
      searchTerm === '' || employeeName.includes(searchTerm.toLowerCase());
    const matchesStatus =
      selectedStatus === 'all' || payroll.status === selectedStatus;
    const matchesMonth =
      selectedMonth === 'all' ||
      payroll.period.month.toString() === selectedMonth;
    const matchesYear =
      selectedYear === 'all' || payroll.period.year.toString() === selectedYear;
    const matchesDepartment =
      selectedDepartment === 'all' || department === selectedDepartment;

    return (
      matchesSearch &&
      matchesStatus &&
      matchesMonth &&
      matchesYear &&
      matchesDepartment
    );
  });

  // Summary calculations
  const totalGrossPay = filteredPayrolls.reduce(
    (sum, p) => sum + p.grossPay,
    0,
  );
  const totalNetPay = filteredPayrolls.reduce((sum, p) => sum + p.netPay, 0);

  const totalOvertimeHours = filteredPayrolls.reduce(
    (sum, p) => sum + p.overtimeHours,
    0,
  );

  // Get unique departments
  const departments = [...new Set(employees.map((e) => e.department))].filter(
    Boolean,
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-10">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Gestión de Nóminas</h1>
          <p className="text-gray-600">
            Administra las nóminas de los empleados
          </p>
        </div>
        <Button
          onClick={() => router.push('/private/payroll/new')}
          className="flex items-center gap-2"
        >
          <PlusIcon className="h-4 w-4" />
          Nueva Nómina
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSignIcon className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Pago Bruto Total
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(totalGrossPay)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUpIcon className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Pago Neto Total
                </p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(totalNetPay)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <UsersIcon className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Empleados</p>
                <p className="text-2xl font-bold text-purple-600">
                  {filteredPayrolls.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CalendarIcon className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Horas Extra</p>
                <p className="text-2xl font-bold text-orange-600">
                  {totalOvertimeHours.toFixed(1)}h
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FilterIcon className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div>
              <Label htmlFor="search">Buscar Empleado</Label>
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Nombre del empleado..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="status">Estado</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value={PayrollStatusEnum.DRAFT}>
                    Borrador
                  </SelectItem>
                  <SelectItem value={PayrollStatusEnum.APPROVED}>
                    Aprobado
                  </SelectItem>
                  <SelectItem value={PayrollStatusEnum.PAID}>Pagado</SelectItem>
                  <SelectItem value={PayrollStatusEnum.CANCELLED}>
                    Cancelado
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="month">Mes</Label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {Array.from({ length: 12 }, (_, i) => (
                    <SelectItem key={i + 1} value={(i + 1).toString()}>
                      {new Date(0, i).toLocaleDateString('es-ES', {
                        month: 'long',
                      })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="year">Año</Label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {Array.from({ length: 5 }, (_, i) => {
                    const year = new Date().getFullYear() - i;
                    return (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="department">Departamento</Label>
              <Select
                value={selectedDepartment}
                onValueChange={setSelectedDepartment}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedStatus('all');
                  setSelectedMonth('all');
                  setSelectedYear(new Date().getFullYear().toString());
                  setSelectedDepartment('all');
                }}
                className="w-full"
              >
                Limpiar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payroll Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Nóminas</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <DownloadIcon className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredPayrolls.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No hay nóminas que coincidan con los filtros</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2">Empleado</th>
                    <th className="text-left py-3 px-2">Departamento</th>
                    <th className="text-left py-3 px-2">Período</th>
                    <th className="text-left py-3 px-2">Horas</th>
                    <th className="text-left py-3 px-2">Salario Bruto</th>
                    <th className="text-left py-3 px-2">Salario Neto</th>
                    <th className="text-left py-3 px-2">Estado</th>
                    <th className="text-left py-3 px-2">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayrolls.map((payroll) => (
                    <tr key={payroll.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              router.push(
                                `/private/employees/${payroll.employeeId}`,
                              )
                            }
                            className="p-1 h-6 w-6"
                          >
                            <UserIcon className="h-3 w-3" />
                          </Button>
                          <div>
                            <p className="font-medium">
                              {getEmployeeName(payroll.employeeId)}
                            </p>
                            <p className="text-xs text-gray-500">
                              ID: {payroll.employeeId.slice(0, 8)}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <Badge variant="outline">
                          {getEmployeeDepartment(payroll.employeeId)}
                        </Badge>
                      </td>
                      <td className="py-3 px-2">
                        {formatMonthYear(
                          payroll.period.month,
                          payroll.period.year,
                        )}
                      </td>
                      <td className="py-3 px-2">
                        <div>
                          <p>{payroll.hoursWorked.toFixed(1)}h</p>
                          {payroll.overtimeHours > 0 && (
                            <p className="text-xs text-orange-600">
                              +{payroll.overtimeHours.toFixed(1)}h extra
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-2 font-medium">
                        {formatCurrency(payroll.grossPay)}
                      </td>
                      <td className="py-3 px-2 font-medium text-green-600">
                        {formatCurrency(payroll.netPay)}
                      </td>
                      <td className="py-3 px-2">
                        {getStatusBadge(payroll.status)}
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              router.push(`/private/payroll/${payroll.id}`)
                            }
                          >
                            <EyeIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

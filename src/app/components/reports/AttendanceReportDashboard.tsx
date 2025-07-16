'use client';

import { useEffect, useState } from 'react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Employee } from '@/types/employee';
import { AttendanceSummary, DailyAttendance } from '@/types/attendance';
import { AttendanceStatusEnum } from '@/types/enumShared';
import { employeeService } from '@/services/firebase/genericServices';
import { attendanceReportService } from '@/services/attendanceService';
import {
  AlertCircleIcon,
  BarChart3Icon,
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
  DownloadIcon,
  TrendingUpIcon,
  UsersIcon,
  XCircleIcon,
} from 'lucide-react';

export default function AttendanceReportDashboard() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendanceSummaries, setAttendanceSummaries] = useState<
    AttendanceSummary[]
  >([]);
  const [dailyCalendar, setDailyCalendar] = useState<DailyAttendance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (employees.length > 0) {
      generateReports();
    }
  }, [
    employees,
    selectedMonth,
    selectedYear,
    selectedEmployee,
    selectedDepartment,
  ]);

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

  const generateReports = async () => {
    setLoading(true);
    setError(null);

    try {
      const filteredEmployees = getFilteredEmployees();

      // Generate attendance summaries
      const summaries: AttendanceSummary[] = [];
      for (const employee of filteredEmployees) {
        const summary =
          await attendanceReportService.generateEmployeeAttendanceSummary(
            employee.id,
            selectedMonth,
            selectedYear,
          );
        if (summary) {
          summaries.push(summary);
        }
      }

      setAttendanceSummaries(summaries);

      // Generate daily calendar if single employee selected
      if (selectedEmployee !== 'all') {
        const calendar =
          await attendanceReportService.getDailyAttendanceCalendar(
            selectedEmployee,
            selectedMonth,
            selectedYear,
          );
        setDailyCalendar(calendar);
      } else {
        setDailyCalendar([]);
      }
    } catch (err) {
      console.error('Error generating reports:', err);
      setError('Error al generar reportes');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredEmployees = () => {
    let filtered = employees;

    if (selectedEmployee !== 'all') {
      filtered = filtered.filter((emp) => emp.id === selectedEmployee);
    }

    if (selectedDepartment !== 'all') {
      filtered = filtered.filter(
        (emp) => emp.department === selectedDepartment,
      );
    }

    return filtered;
  };

  const getDepartments = () => {
    return [...new Set(employees.map((emp) => emp.department))].filter(Boolean);
  };

  const getOverallStats = () => {
    if (attendanceSummaries.length === 0) {
      return {
        totalEmployees: 0,
        averageAttendanceRate: 0,
        totalPresentDays: 0,
        totalAbsentDays: 0,
        totalOvertimeHours: 0,
      };
    }

    const totalEmployees = attendanceSummaries.length;
    const averageAttendanceRate =
      attendanceSummaries.reduce((sum, s) => sum + s.attendanceRate, 0) /
      totalEmployees;
    const totalPresentDays = attendanceSummaries.reduce(
      (sum, s) => sum + s.presentDays,
      0,
    );
    const totalAbsentDays = attendanceSummaries.reduce(
      (sum, s) => sum + s.absentDays,
      0,
    );
    const totalOvertimeHours = attendanceSummaries.reduce(
      (sum, s) => sum + s.overtimeHours,
      0,
    );

    return {
      totalEmployees,
      averageAttendanceRate,
      totalPresentDays,
      totalAbsentDays,
      totalOvertimeHours,
    };
  };

  const getAttendanceRateColor = (rate: number) => {
    if (rate >= 95) return 'text-green-600';
    if (rate >= 85) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getAttendanceRateBadge = (rate: number) => {
    if (rate >= 95) return 'bg-green-100 text-green-800';
    if (rate >= 85) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getStatusIcon = (status: AttendanceStatusEnum) => {
    switch (status) {
      case AttendanceStatusEnum.PRESENT:
        return <CheckCircleIcon className="h-4 w-4 text-green-600" />;
      case AttendanceStatusEnum.ABSENT:
        return <XCircleIcon className="h-4 w-4 text-red-600" />;
      case AttendanceStatusEnum.LATE:
        return <AlertCircleIcon className="h-4 w-4 text-yellow-600" />;
      case AttendanceStatusEnum.HOLIDAY:
        return <CalendarIcon className="h-4 w-4 text-blue-600" />;
      default:
        return <ClockIcon className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;

  const overallStats = getOverallStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Reportes de Asistencia</h1>
          <p className="text-gray-600">
            Análisis detallado de asistencia de empleados
          </p>
        </div>
        <Button className="flex items-center gap-2">
          <DownloadIcon className="h-4 w-4" />
          Exportar Reporte
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="month">Mes</Label>
              <Select
                value={selectedMonth.toString()}
                onValueChange={(value) => setSelectedMonth(parseInt(value))}
              >
                <SelectTrigger>
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
            </div>

            <div>
              <Label htmlFor="year">Año</Label>
              <Input
                type="number"
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                min="2020"
                max="2030"
              />
            </div>

            <div>
              <Label htmlFor="employee">Empleado</Label>
              <Select
                value={selectedEmployee}
                onValueChange={setSelectedEmployee}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los empleados</SelectItem>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.firstName} {employee.lastName}
                    </SelectItem>
                  ))}
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
                  <SelectItem value="all">Todos los departamentos</SelectItem>
                  {getDepartments().map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          {/* Overall Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <UsersIcon className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      Empleados
                    </p>
                    <p className="text-2xl font-bold text-blue-600">
                      {overallStats.totalEmployees}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <TrendingUpIcon className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      Asistencia Promedio
                    </p>
                    <p
                      className={`text-2xl font-bold ${getAttendanceRateColor(overallStats.averageAttendanceRate)}`}
                    >
                      {formatPercentage(overallStats.averageAttendanceRate)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <CheckCircleIcon className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      Días Presente
                    </p>
                    <p className="text-2xl font-bold text-green-600">
                      {overallStats.totalPresentDays}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <XCircleIcon className="h-8 w-8 text-red-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      Días Ausente
                    </p>
                    <p className="text-2xl font-bold text-red-600">
                      {overallStats.totalAbsentDays}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <ClockIcon className="h-8 w-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      Horas Extra
                    </p>
                    <p className="text-2xl font-bold text-purple-600">
                      {overallStats.totalOvertimeHours.toFixed(1)}h
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="summary" className="space-y-4">
            <TabsList>
              <TabsTrigger value="summary">Resumen por Empleado</TabsTrigger>
              {selectedEmployee !== 'all' && (
                <TabsTrigger value="calendar">Calendario Diario</TabsTrigger>
              )}
              <TabsTrigger value="analytics">Análisis</TabsTrigger>
            </TabsList>

            <TabsContent value="summary">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3Icon className="h-5 w-5" />
                    Resumen de Asistencia por Empleado
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {attendanceSummaries.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <UsersIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p>
                        No hay datos de asistencia para el período seleccionado
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-3 px-2">Empleado</th>
                            <th className="text-left py-3 px-2">
                              Departamento
                            </th>
                            <th className="text-left py-3 px-2">
                              Días Trabajados
                            </th>
                            <th className="text-left py-3 px-2">Faltas</th>
                            <th className="text-left py-3 px-2">Tardanzas</th>
                            <th className="text-left py-3 px-2">
                              Horas Totales
                            </th>
                            <th className="text-left py-3 px-2">Horas Extra</th>
                            <th className="text-left py-3 px-2">
                              % Asistencia
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {attendanceSummaries.map((summary) => (
                            <tr
                              key={summary.employeeId}
                              className="border-b hover:bg-gray-50"
                            >
                              <td className="py-3 px-2">
                                <div>
                                  <p className="font-medium">
                                    {summary.employeeName}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {summary.position}
                                  </p>
                                </div>
                              </td>
                              <td className="py-3 px-2">
                                <Badge variant="outline">
                                  {summary.department}
                                </Badge>
                              </td>
                              <td className="py-3 px-2 text-center">
                                <span className="font-medium text-green-600">
                                  {summary.presentDays}
                                </span>
                                <span className="text-gray-400">
                                  /{summary.workingDays}
                                </span>
                              </td>
                              <td className="py-3 px-2 text-center">
                                <span className="font-medium text-red-600">
                                  {summary.absentDays}
                                </span>
                              </td>
                              <td className="py-3 px-2 text-center">
                                <span className="font-medium text-yellow-600">
                                  {summary.lateDays}
                                </span>
                              </td>
                              <td className="py-3 px-2 text-center">
                                <span className="font-medium">
                                  {summary.totalHours.toFixed(1)}h
                                </span>
                              </td>
                              <td className="py-3 px-2 text-center">
                                <span className="font-medium text-purple-600">
                                  {summary.overtimeHours.toFixed(1)}h
                                </span>
                              </td>
                              <td className="py-3 px-2 text-center">
                                <Badge
                                  className={getAttendanceRateBadge(
                                    summary.attendanceRate,
                                  )}
                                >
                                  {formatPercentage(summary.attendanceRate)}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {selectedEmployee !== 'all' && (
              <TabsContent value="calendar">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CalendarIcon className="h-5 w-5" />
                      Calendario de Asistencia Diaria
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {dailyCalendar.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                        <p>
                          No hay datos de calendario para el período
                          seleccionado
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-7 gap-2">
                        {/* Header */}
                        {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(
                          (day) => (
                            <div
                              key={day}
                              className="p-2 text-center font-medium text-gray-600 text-sm"
                            >
                              {day}
                            </div>
                          ),
                        )}

                        {/* Calendar days */}
                        {dailyCalendar.map((day, index) => (
                          <div
                            key={index}
                            className={`
                              p-2 text-center text-sm border rounded-lg h-16 flex flex-col justify-center
                              ${day.isWorkingDay ? 'bg-white' : 'bg-gray-100'}
                              ${day.status === AttendanceStatusEnum.PRESENT ? 'border-green-200 bg-green-50' : ''}
                              ${day.status === AttendanceStatusEnum.ABSENT ? 'border-red-200 bg-red-50' : ''}
                              ${day.status === AttendanceStatusEnum.LATE ? 'border-yellow-200 bg-yellow-50' : ''}
                              ${day.status === AttendanceStatusEnum.HOLIDAY ? 'border-blue-200 bg-blue-50' : ''}
                            `}
                          >
                            <div className="flex items-center justify-center gap-1">
                              <span className="font-medium">
                                {day.date.getDate()}
                              </span>
                              {getStatusIcon(day.status)}
                            </div>
                            {day.attendance && (
                              <div className="text-xs text-gray-600">
                                {day.attendance.totalHours.toFixed(1)}h
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            <TabsContent value="analytics">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Análisis de Tendencias</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">
                          Empleados con asistencia perfecta (95%+):
                        </span>
                        <Badge className="bg-green-100 text-green-800">
                          {
                            attendanceSummaries.filter(
                              (s) => s.attendanceRate >= 95,
                            ).length
                          }
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">
                          Empleados con asistencia regular (85-94%):
                        </span>
                        <Badge className="bg-yellow-100 text-yellow-800">
                          {
                            attendanceSummaries.filter(
                              (s) =>
                                s.attendanceRate >= 85 && s.attendanceRate < 95,
                            ).length
                          }
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">
                          Empleados con baja asistencia (&lt;85%):
                        </span>
                        <Badge className="bg-red-100 text-red-800">
                          {
                            attendanceSummaries.filter(
                              (s) => s.attendanceRate < 85,
                            ).length
                          }
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Estadísticas Adicionales</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">
                          Total días de vacaciones:
                        </span>
                        <span className="font-medium">
                          {attendanceSummaries.reduce(
                            (sum, s) => sum + s.vacationDays,
                            0,
                          )}{' '}
                          días
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">
                          Total días de permiso médico:
                        </span>
                        <span className="font-medium">
                          {attendanceSummaries.reduce(
                            (sum, s) => sum + s.sickLeaveDays,
                            0,
                          )}{' '}
                          días
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">
                          Promedio horas por empleado:
                        </span>
                        <span className="font-medium">
                          {attendanceSummaries.length > 0
                            ? (
                                attendanceSummaries.reduce(
                                  (sum, s) => sum + s.totalHours,
                                  0,
                                ) / attendanceSummaries.length
                              ).toFixed(1)
                            : '0'}
                          h
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}

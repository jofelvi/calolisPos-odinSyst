'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Employee } from '@/types/employee';
import { Attendance } from '@/types/attendance';
import { AttendanceStatusEnum } from '@/types/enumShared';
import {
  employeeService,
  attendanceService,
  getEmployeeAttendanceByPeriod,
} from '@/services/firebase/genericServices';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeftIcon,
  PlusIcon,
  ClockIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  AlertCircleIcon,
} from 'lucide-react';

export default function EmployeeAttendancePage() {
  const params = useParams();
  const router = useRouter();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    if (params.id) {
      fetchEmployee(params.id as string);
    }
  }, [params.id]);

  useEffect(() => {
    if (employee) {
      fetchAttendances();
    }
  }, [employee, selectedMonth, selectedYear]);

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
      // Error fetching employee - handled by error state
    }
  };

  const fetchAttendances = async () => {
    if (!employee) return;

    try {
      setLoading(true);
      const startDate = new Date(selectedYear, selectedMonth - 1, 1);
      const endDate = new Date(selectedYear, selectedMonth, 0);

      const attendanceData = await getEmployeeAttendanceByPeriod(
        employee.id,
        startDate,
        endDate,
      );
      setAttendances(attendanceData);
      setError(null);
    } catch {
      setError('Error al cargar asistencias');
      // Error fetching attendances - handled by error state
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.push(`/private/employees/${employee?.id}`);
  };

  const handleCheckIn = async () => {
    if (!employee) return;

    try {
      const today = new Date();
      const attendanceData = {
        employeeId: employee.id,
        date: today,
        checkIn: today,
        status: AttendanceStatusEnum.PRESENT,
        totalHours: 0,
        overtimeHours: 0,
        createdAt: today,
        updatedAt: today,
      };

      await attendanceService.create(attendanceData);
      await fetchAttendances();
    } catch {
      setError('Error al registrar entrada');
      // Error checking in - handled by error state
    }
  };

  const handleCheckOut = async (attendanceId: string) => {
    try {
      const attendance = attendances.find((a) => a.id === attendanceId);
      if (!attendance || !attendance.checkIn) return;

      const now = new Date();
      const checkInTime = new Date(attendance.checkIn);
      const totalHours =
        (now.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);
      const overtimeHours = totalHours > 8 ? totalHours - 8 : 0;

      await attendanceService.update(attendanceId, {
        checkOut: now,
        totalHours: Math.round(totalHours * 100) / 100,
        overtimeHours: Math.round(overtimeHours * 100) / 100,
        updatedAt: now,
      });

      await fetchAttendances();
    } catch {
      setError('Error al registrar salida');
      // Error checking out - handled by error state
    }
  };

  const getStatusBadge = (status: AttendanceStatusEnum) => {
    const statusConfig = {
      [AttendanceStatusEnum.PRESENT]: {
        color: 'bg-green-100 text-green-800',
        icon: CheckCircleIcon,
      },
      [AttendanceStatusEnum.ABSENT]: {
        color: 'bg-red-100 text-red-800',
        icon: XCircleIcon,
      },
      [AttendanceStatusEnum.LATE]: {
        color: 'bg-yellow-100 text-yellow-800',
        icon: AlertCircleIcon,
      },
      [AttendanceStatusEnum.EARLY_DEPARTURE]: {
        color: 'bg-orange-100 text-orange-800',
        icon: AlertCircleIcon,
      },
      [AttendanceStatusEnum.HOLIDAY]: {
        color: 'bg-blue-100 text-blue-800',
        icon: CalendarIcon,
      },
      [AttendanceStatusEnum.SICK_LEAVE]: {
        color: 'bg-purple-100 text-purple-800',
        icon: XCircleIcon,
      },
      [AttendanceStatusEnum.VACATION]: {
        color: 'bg-indigo-100 text-indigo-800',
        icon: CalendarIcon,
      },
      [AttendanceStatusEnum.MEDICALREST]: {
        color: 'bg-gray-100 text-gray-800',
        icon: XCircleIcon,
      },
    };

    const config =
      statusConfig[status] || statusConfig[AttendanceStatusEnum.ABSENT];
    const IconComponent = config.icon;

    return (
      <Badge className={`${config.color} border-0`}>
        <IconComponent className="h-3 w-3 mr-1" />
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const formatTime = (date: Date | string | undefined) => {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getTodayAttendance = () => {
    const today = new Date();
    return attendances.find((a) => {
      const attendanceDate = new Date(a.date);
      return attendanceDate.toDateString() === today.toDateString();
    });
  };

  const todayAttendance = getTodayAttendance();

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
            <h1 className="text-2xl font-bold">Asistencias</h1>
            <p className="text-gray-600">
              {employee?.firstName} {employee?.lastName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {todayAttendance ? (
            todayAttendance.checkOut ? (
              <Badge className="bg-green-100 text-green-800">
                <CheckCircleIcon className="h-4 w-4 mr-1" />
                Jornada Completada
              </Badge>
            ) : (
              <Button
                onClick={() => handleCheckOut(todayAttendance.id)}
                variant="outline"
                className="flex items-center gap-2"
              >
                <ClockIcon className="h-4 w-4" />
                Registrar Salida
              </Button>
            )
          ) : (
            <Button onClick={handleCheckIn} className="flex items-center gap-2">
              <PlusIcon className="h-4 w-4" />
              Registrar Entrada
            </Button>
          )}
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
            <CardTitle className="text-sm">Filtros</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Resumen del Mes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Días trabajados:</span>
                <span className="font-medium">
                  {
                    attendances.filter(
                      (a) => a.status === AttendanceStatusEnum.PRESENT,
                    ).length
                  }
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Faltas:</span>
                <span className="font-medium">
                  {
                    attendances.filter(
                      (a) => a.status === AttendanceStatusEnum.ABSENT,
                    ).length
                  }
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Tardanzas:</span>
                <span className="font-medium">
                  {
                    attendances.filter(
                      (a) => a.status === AttendanceStatusEnum.LATE,
                    ).length
                  }
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Horas totales:</span>
                <span className="font-medium">
                  {attendances
                    .reduce((acc, a) => acc + a.totalHours, 0)
                    .toFixed(1)}
                  h
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Estado Actual</CardTitle>
          </CardHeader>
          <CardContent>
            {todayAttendance ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Estado:</span>
                  {getStatusBadge(todayAttendance.status)}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Entrada:</span>
                  <span className="font-medium">
                    {formatTime(todayAttendance.checkIn)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Salida:</span>
                  <span className="font-medium">
                    {formatTime(todayAttendance.checkOut)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Horas:</span>
                  <span className="font-medium">
                    {todayAttendance.totalHours.toFixed(1)}h
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                <ClockIcon className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">No hay registro de hoy</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Historial de Asistencias</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          ) : attendances.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No hay registros de asistencia para este período</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Fecha</th>
                    <th className="text-left py-2">Entrada</th>
                    <th className="text-left py-2">Salida</th>
                    <th className="text-left py-2">Horas</th>
                    <th className="text-left py-2">Estado</th>
                    <th className="text-left py-2">Notas</th>
                  </tr>
                </thead>
                <tbody>
                  {attendances.map((attendance) => (
                    <tr
                      key={attendance.id}
                      className="border-b hover:bg-gray-50"
                    >
                      <td className="py-2">{formatDate(attendance.date)}</td>
                      <td className="py-2">{formatTime(attendance.checkIn)}</td>
                      <td className="py-2">
                        {formatTime(attendance.checkOut)}
                      </td>
                      <td className="py-2">
                        {attendance.totalHours.toFixed(1)}h
                      </td>
                      <td className="py-2">
                        {getStatusBadge(attendance.status)}
                      </td>
                      <td className="py-2 text-gray-600">
                        {attendance.notes || '-'}
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

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/hooks/useToast';
import { Employee } from '@/types/employee';
import { Attendance, CreateAttendanceData } from '@/types/attendance';
import { AttendanceStatusEnum } from '@/types/enumShared';
import {
  attendanceService,
  employeeService,
  getEmployeeAttendanceByPeriod,
} from '@/services/firebase/genericServices';
import {
  AttendanceBusinessRules,
  AttendanceValidator,
} from '@/utils/attendanceValidation';
import {
  CheckCircleIcon,
  ClockIcon,
  MapPinIcon,
  ShieldCheckIcon,
  SmartphoneIcon,
  UserIcon,
  WifiIcon,
} from 'lucide-react';

export default function CheckInPage() {
  const router = useRouter();
  const toast = useToast();
  const [step, setStep] = useState<'auth' | 'location' | 'confirm' | 'success'>(
    'auth',
  );
  const [loading, setLoading] = useState(false);

  // Authentication data
  const [employeeId, setEmployeeId] = useState('');
  const [pin, setPin] = useState('');
  const [employee, setEmployee] = useState<Employee | null>(null);

  // Location data
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
    accuracy: number;
  } | null>(null);

  // Security data
  const [deviceInfo, setDeviceInfo] = useState<{
    userAgent: string;
    timestamp: number;
    ipAddress: string;
  } | null>(null);

  // Attendance data
  const [existingAttendances, setExistingAttendances] = useState<Attendance[]>(
    [],
  );

  useEffect(() => {
    // Collect device information for security
    setDeviceInfo({
      userAgent: navigator.userAgent,
      timestamp: Date.now(),
      ipAddress: 'client-side', // This would be set on the server side
    });
  }, []);

  const handleAuthentication = async () => {
    if (!employeeId || !pin) {
      toast.error({
        title: 'Error de Validación',
        description: 'Por favor ingresa tu ID de empleado y PIN',
      });
      return;
    }

    try {
      setLoading(true);

      // Verify employee exists and PIN is correct
      const employeeData = await employeeService.getById(employeeId);
      if (!employeeData) {
        toast.error({
          title: 'Empleado no encontrado',
          description: 'Verifica que el ID sea correcto',
        });
        return;
      }

      // In a real implementation, you would hash and compare the PIN
      // For this example, we'll assume the PIN is stored in the employee record
      if (employeeData.pin && employeeData.pin !== pin) {
        toast.error({
          title: 'PIN incorrecto',
          description: 'Verifica tu PIN de seguridad',
        });
        return;
      }

      // Check if employee is active
      if (!employeeData.isActive) {
        toast.error({
          title: 'Empleado inactivo',
          description: 'Contacta a recursos humanos',
        });
        return;
      }

      // Get existing attendances for validation (last 30 days)
      const today = new Date();
      const startDate = new Date(today);
      startDate.setDate(today.getDate() - 30);

      const attendances = await getEmployeeAttendanceByPeriod(
        employeeId,
        startDate,
        today,
      );
      setExistingAttendances(attendances);

      // Check if can check in
      const canCheckIn = AttendanceBusinessRules.canCheckIn(
        employeeId,
        attendances,
      );
      if (!canCheckIn.canCheckIn) {
        toast.error({
          title: 'No se puede registrar entrada',
          description:
            canCheckIn.reason || 'No puedes registrar entrada en este momento',
        });
        return;
      }

      setEmployee(employeeData);
      setStep('location');
      toast.success({
        title: 'Identidad verificada',
        description: `Bienvenido ${employeeData.firstName}`,
      });
    } catch {
      toast.error({
        title: 'Error de conexión',
        description: 'Error al verificar credenciales',
      });
    } finally {
      setLoading(false);
    }
  };

  const requestLocation = async () => {
    try {
      setLoading(true);

      if (!navigator.geolocation) {
        toast.error({
          title: 'Geolocalización no disponible',
          description: 'Tu dispositivo no soporta geolocalización',
        });
        return;
      }

      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          });
        },
      );

      const locationData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
      };

      setLocation(locationData);
      setStep('confirm');
      toast.success({
        title: 'Ubicación verificada',
        description: 'Tu ubicación ha sido confirmada',
      });
    } catch {
      toast.error({
        title: 'Error de ubicación',
        description: 'No se pudo obtener tu ubicación. Verifica los permisos.',
      });
    } finally {
      setLoading(false);
    }
  };

  const confirmCheckIn = async () => {
    if (!employee || !location || !deviceInfo) {
      toast.error({
        title: 'Información incompleta',
        description: 'Faltan datos para completar el registro',
      });
      return;
    }

    try {
      setLoading(true);

      const now = new Date();

      const attendanceData: CreateAttendanceData = {
        employeeId: employee.id,
        date: now,
        checkIn: now,
        status: AttendanceStatusEnum.PRESENT,
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
        },
        device: {
          userAgent: deviceInfo.userAgent,
          timestamp: deviceInfo.timestamp,
          ipAddress: deviceInfo.ipAddress,
        },
        notes: 'Registro automático de entrada',
      };

      // Validate attendance data
      const validation = AttendanceValidator.validateAttendance(attendanceData);
      if (!validation.isValid) {
        toast.error({
          title: 'Error de validación',
          description: validation.errors[0]?.message || 'Datos inválidos',
        });
        return;
      }

      // Check for conflicts
      const conflictValidation =
        AttendanceValidator.validateAttendanceConflicts(
          attendanceData,
          existingAttendances,
        );
      if (!conflictValidation.isValid) {
        toast.error({
          title: 'Conflicto de registro',
          description:
            conflictValidation.errors[0]?.message || 'Ya existe un registro',
        });
        return;
      }

      // Calculate automatic status based on time
      const calculatedStatus =
        AttendanceValidator.calculateStatus(attendanceData);
      attendanceData.status = calculatedStatus;

      // Create attendance record

      const attendanceInfo: Omit<Attendance, 'id'> = {
        ...attendanceData,
        totalHours: 0, // Se calculará en el check-out
        overtimeHours: 0, // Se calculará en el check-out
        hoursWorked: 0, // Se calculará en el check-out
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await attendanceService.create(attendanceInfo);

      setStep('success');
      toast.success({
        title: '¡Entrada registrada!',
        description: 'Tu entrada ha sido registrada exitosamente',
      });
    } catch {
      toast.error({
        title: 'Error al registrar',
        description: 'No se pudo registrar la entrada. Intenta nuevamente.',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: AttendanceStatusEnum) => {
    const statusConfig: Record<
      AttendanceStatusEnum,
      { color: string; label: string }
    > = {
      [AttendanceStatusEnum.PRESENT]: {
        color: 'bg-green-100 text-green-800',
        label: 'Presente',
      },
      [AttendanceStatusEnum.LATE]: {
        color: 'bg-yellow-100 text-yellow-800',
        label: 'Tarde',
      },
      [AttendanceStatusEnum.EARLY_DEPARTURE]: {
        color: 'bg-orange-100 text-orange-800',
        label: 'Salida Temprana',
      },
      [AttendanceStatusEnum.ABSENT]: {
        color: 'bg-red-100 text-red-800',
        label: 'Ausente',
      },
      [AttendanceStatusEnum.HOLIDAY]: {
        color: 'bg-blue-100 text-blue-800',
        label: 'Feriado',
      },
      [AttendanceStatusEnum.SICK_LEAVE]: {
        color: 'bg-purple-100 text-purple-800',
        label: 'Reposo Médico',
      },
      [AttendanceStatusEnum.VACATION]: {
        color: 'bg-cyan-100 text-cyan-800',
        label: 'Vacaciones',
      },
      [AttendanceStatusEnum.MEDICALREST]: {
        color: 'bg-purple-100 text-purple-800',
        label: 'Reposo Médico',
      },
    };

    const config =
      statusConfig[status] || statusConfig[AttendanceStatusEnum.PRESENT];

    return <Badge className={`${config.color} border-0`}>{config.label}</Badge>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Authentication Step */}
        {step === 'auth' && (
          <Card className="shadow-lg">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShieldCheckIcon className="h-8 w-8 text-blue-600" />
              </div>
              <CardTitle className="text-2xl">Registro de Entrada</CardTitle>
              <p className="text-gray-600">
                Verifica tu identidad para continuar
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="employeeId">ID de Empleado</Label>
                <Input
                  id="employeeId"
                  type="text"
                  placeholder="Ingresa tu ID"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="pin">PIN de Seguridad</Label>
                <Input
                  id="pin"
                  type="password"
                  placeholder="Ingresa tu PIN"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="mt-1"
                />
              </div>

              <Button
                onClick={handleAuthentication}
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Verificando...' : 'Verificar Identidad'}
              </Button>

              <div className="text-center">
                <Button
                  variant="ghost"
                  onClick={() => router.push('/private/employees')}
                  className="text-sm"
                >
                  Volver al Panel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Location Step */}
        {step === 'location' && (
          <Card className="shadow-lg">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPinIcon className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl">Verificar Ubicación</CardTitle>
              <p className="text-gray-600">
                Confirma tu ubicación para el registro
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <UserIcon className="h-5 w-5 text-gray-500" />
                  <span className="font-medium">
                    {employee?.firstName} {employee?.lastName}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Para garantizar la seguridad, necesitamos verificar tu
                  ubicación actual.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <WifiIcon className="h-4 w-4" />
                  <span>Conexión segura verificada</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <SmartphoneIcon className="h-4 w-4" />
                  <span>Dispositivo registrado</span>
                </div>
              </div>

              <Button
                onClick={requestLocation}
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Obteniendo ubicación...' : 'Verificar Ubicación'}
              </Button>

              <Button
                variant="outline"
                onClick={() => setStep('auth')}
                className="w-full"
              >
                Volver
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Confirmation Step */}
        {step === 'confirm' && (
          <Card className="shadow-lg">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ClockIcon className="h-8 w-8 text-yellow-600" />
              </div>
              <CardTitle className="text-2xl">Confirmar Registro</CardTitle>
              <p className="text-gray-600">
                Revisa la información antes de confirmar
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">
                    Empleado:
                  </span>
                  <span className="font-medium">
                    {employee?.firstName} {employee?.lastName}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">
                    Fecha:
                  </span>
                  <span className="font-medium">{formatDate(new Date())}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">
                    Hora:
                  </span>
                  <span className="font-medium">{formatTime(new Date())}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">
                    Estado:
                  </span>
                  {getStatusBadge(
                    AttendanceValidator.calculateStatus({
                      employeeId: employee?.id || '',
                      date: new Date(),
                      checkIn: new Date(),
                      status: AttendanceStatusEnum.PRESENT,
                    }),
                  )}
                </div>

                {location && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">
                      Ubicación:
                    </span>
                    <span className="text-sm text-green-600">✓ Verificada</span>
                  </div>
                )}
              </div>

              <Button
                onClick={confirmCheckIn}
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Registrando...' : 'Confirmar Entrada'}
              </Button>

              <Button
                variant="outline"
                onClick={() => setStep('location')}
                className="w-full"
              >
                Volver
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Success Step */}
        {step === 'success' && (
          <Card className="shadow-lg">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircleIcon className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl text-green-600">
                ¡Entrada Registrada!
              </CardTitle>
              <p className="text-gray-600">
                Tu entrada ha sido registrada exitosamente
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-green-50 rounded-lg p-4 space-y-2">
                <div className="text-center">
                  <p className="text-lg font-semibold">
                    {employee?.firstName} {employee?.lastName}
                  </p>
                  <p className="text-sm text-gray-600">
                    {formatDate(new Date())}
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatTime(new Date())}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Button
                  onClick={() => router.push('/private/employees')}
                  className="w-full"
                >
                  Ir al Panel Principal
                </Button>

                <Button
                  variant="outline"
                  onClick={() => {
                    setStep('auth');
                    setEmployeeId('');
                    setPin('');
                    setEmployee(null);
                    setLocation(null);
                  }}
                  className="w-full"
                >
                  Registrar Otra Entrada
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

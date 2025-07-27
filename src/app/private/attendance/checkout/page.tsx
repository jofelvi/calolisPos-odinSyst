'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/hooks/useToast';
import { Textarea } from '@/components/ui/textarea';
import { Employee } from '@/modelTypes/employee';
import { Attendance } from '@/modelTypes/attendance';
import { AttendanceStatusEnum } from '@/modelTypes/enumShared';
import {
  attendanceService,
  employeeService,
  getEmployeeAttendanceByPeriod,
} from '@/services/firebase/genericServices';
import { uploadAttendancePhoto } from '@/services/firebase/uploadImage';
import {
  AttendanceBusinessRules,
  AttendanceValidator,
} from '@/shared/utils/attendanceValidation';
import {
  CameraIcon,
  CheckCircleIcon,
  ClockArrowDownIcon,
  ClockIcon,
  LogOutIcon,
} from 'lucide-react';

export default function CheckOutPage() {
  const router = useRouter();
  const toast = useToast();
  const [step, setStep] = useState<
    'auth' | 'review' | 'camera' | 'preview' | 'confirm' | 'success'
  >('auth');
  const [loading, setLoading] = useState(false);

  // Authentication data
  const [employeeId, setEmployeeId] = useState('');
  const [pin, setPin] = useState('');
  const [employee, setEmployee] = useState<Employee | null>(null);

  // Attendance data
  const [todayAttendance, setTodayAttendance] = useState<Attendance | null>(
    null,
  );
  const [notes, setNotes] = useState('');

  // Camera data
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  // Location data
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
    accuracy: number;
  } | null>(null);

  useEffect(() => {
    // Get current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          });
        },
        (error) => {
          console.error('Location error:', error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        },
      );
    }
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

      // Verify PIN
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

      // Check if can check out
      const canCheckOut = AttendanceBusinessRules.canCheckOut(
        employeeId,
        attendances,
      );
      if (!canCheckOut.canCheckOut) {
        toast.error({
          title: 'No se puede registrar salida',
          description:
            canCheckOut.reason || 'No puedes registrar salida en este momento',
        });
        return;
      }

      // Get today's attendance record
      const todayAttendanceRecord = attendances.find(
        (att) => new Date(att.date).toDateString() === today.toDateString(),
      );

      if (!todayAttendanceRecord) {
        toast.error({
          title: 'Sin registro de entrada',
          description: 'No se encontró registro de entrada para hoy',
        });
        return;
      }

      setEmployee(employeeData);
      setTodayAttendance(todayAttendanceRecord);
      setStep('review');
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

  const proceedToCamera = () => {
    setStep('camera');
  };

  // Camera functions
  const startCamera = async () => {
    try {
      setLoading(true);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
      });

      setCameraStream(stream);

      // Configurar video
      setTimeout(() => {
        const video = document.getElementById(
          'camera-video',
        ) as HTMLVideoElement;
        if (video) {
          video.srcObject = stream;
        }
      }, 100);
    } catch (error) {
      console.error('Error accediendo a la cámara:', error);
      toast.error({
        title: 'Error de cámara',
        description: 'No se pudo acceder a la cámara. Verifica los permisos',
      });
    } finally {
      setLoading(false);
    }
  };

  const capturePhoto = () => {
    try {
      const video = document.getElementById('camera-video') as HTMLVideoElement;
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');

      if (!video || !context) {
        toast.error({
          title: 'Error de captura',
          description: 'Error al acceder al video',
        });
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            setPhotoBlob(blob);
            setPhotoUrl(URL.createObjectURL(blob));

            // Detener cámara
            if (cameraStream) {
              cameraStream.getTracks().forEach((track) => track.stop());
              setCameraStream(null);
            }

            setStep('preview');
          }
        },
        'image/jpeg',
        0.8,
      );
    } catch (error) {
      console.error('Error capturando foto:', error);
      toast.error({
        title: 'Error de captura',
        description: 'Error al tomar la foto',
      });
    }
  };

  const proceedToConfirm = () => {
    setStep('confirm');
  };

  // Limpiar recursos
  const cleanup = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    if (photoUrl) {
      URL.revokeObjectURL(photoUrl);
      setPhotoUrl(null);
    }
  };

  const confirmCheckOut = async () => {
    if (!employee || !todayAttendance || !photoBlob) {
      toast.error({
        title: 'Información incompleta',
        description:
          'Faltan datos para completar el registro (incluida la foto)',
      });
      return;
    }

    try {
      setLoading(true);

      // Subir foto a Firebase Storage
      const uploadedPhotoUrl = await uploadAttendancePhoto(
        photoBlob,
        employee.id,
      );

      const now = new Date();
      const checkInTime = new Date(todayAttendance.checkIn!);
      const hoursCalculation = AttendanceValidator.calculateHours({
        employeeId: employee.id,
        date: now,
        checkIn: checkInTime,
        checkOut: now,
        status: AttendanceStatusEnum.PRESENT,
        totalHours: 0,
        overtimeHours: 0,
        createdAt: now,
        updatedAt: now,
      });

      // Determine final status
      let finalStatus = todayAttendance.status;
      if (finalStatus === AttendanceStatusEnum.PRESENT) {
        const standardEnd = new Date(now);
        standardEnd.setHours(18, 0, 0, 0); // 6:00 PM

        if (now.getTime() < standardEnd.getTime() - 15 * 60 * 1000) {
          finalStatus = AttendanceStatusEnum.EARLY_DEPARTURE;
        }
      }

      // Update attendance record
      const updatedAttendance = {
        ...todayAttendance,
        checkOut: now,
        checkOutPhotoUrl: uploadedPhotoUrl, // Add checkout photo URL
        status: finalStatus,
        hoursWorked: hoursCalculation.totalHours,
        overtimeHours: hoursCalculation.overtimeHours,
        location: location
          ? {
              checkOut: location,
            }
          : undefined,
        notes: notes || todayAttendance.notes,
        updatedAt: now,
      };

      await attendanceService.update(todayAttendance.id, updatedAttendance);

      cleanup();
      setStep('success');
      toast.success({
        title: '¡Salida registrada!',
        description: 'Tu salida ha sido registrada exitosamente',
      });
    } catch {
      toast.error({
        title: 'Error al registrar',
        description: 'No se pudo registrar la salida. Intenta nuevamente.',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (date: Date | string) => {
    const dateObj = date instanceof Date ? date : new Date(date);
    if (isNaN(dateObj.getTime())) {
      return 'N/A';
    }
    return dateObj.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const calculateWorkedHours = () => {
    if (!todayAttendance?.checkIn) return '0:00';

    const checkIn = new Date(todayAttendance.checkIn);
    const now = new Date();
    const diff = now.getTime() - checkIn.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return `${hours}:${minutes.toString().padStart(2, '0')}`;
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
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Authentication Step */}
        {step === 'auth' && (
          <Card className="shadow-lg">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <LogOutIcon className="h-8 w-8 text-orange-600" />
              </div>
              <CardTitle className="text-2xl">Registro de Salida</CardTitle>
              <p className="text-gray-600">
                Verifica tu identidad para registrar salida
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

        {/* Review Step */}
        {step === 'review' && (
          <Card className="shadow-lg">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ClockArrowDownIcon className="h-8 w-8 text-blue-600" />
              </div>
              <CardTitle className="text-2xl">Resumen del Día</CardTitle>
              <p className="text-gray-600">Revisa tu jornada laboral</p>
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
                    Hora de Entrada:
                  </span>
                  <span className="font-medium text-green-600">
                    {todayAttendance?.checkIn
                      ? formatTime(todayAttendance.checkIn)
                      : 'N/A'}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">
                    Hora Actual:
                  </span>
                  <span className="font-medium text-orange-600">
                    {formatTime(new Date())}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">
                    Horas Trabajadas:
                  </span>
                  <span className="font-medium text-blue-600">
                    {calculateWorkedHours()}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">
                    Estado:
                  </span>
                  {todayAttendance?.status &&
                    getStatusBadge(todayAttendance.status)}
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Notas Adicionales (Opcional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Agrega cualquier comentario sobre tu jornada..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-1"
                  rows={3}
                />
              </div>

              <Button onClick={proceedToCamera} className="w-full">
                Continuar
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

        {/* Camera Step */}
        {step === 'camera' && (
          <Card className="shadow-lg">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CameraIcon className="h-8 w-8 text-purple-600" />
              </div>
              <CardTitle className="text-xl">Foto Obligatoria</CardTitle>
              <p className="text-gray-600">
                {employee?.firstName} {employee?.lastName}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {!cameraStream && (
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-4">
                    Es obligatorio tomar una foto para registrar tu salida
                  </p>
                  <Button
                    onClick={startCamera}
                    disabled={loading}
                    className="w-full"
                  >
                    {loading ? 'Iniciando cámara...' : 'Activar Cámara'}
                  </Button>
                </div>
              )}

              {cameraStream && (
                <div className="text-center space-y-4">
                  <div className="relative">
                    <video
                      id="camera-video"
                      autoPlay
                      playsInline
                      className="w-full h-64 object-cover rounded-lg bg-gray-100"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={capturePhoto} className="flex-1">
                      <CameraIcon className="h-4 w-4 mr-2" />
                      Tomar Foto
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        cleanup();
                        setStep('review');
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Preview Step */}
        {step === 'preview' && photoUrl && (
          <Card className="shadow-lg">
            <CardHeader className="text-center">
              <CardTitle className="text-xl">Confirmar Foto</CardTitle>
              <p className="text-gray-600">
                {employee?.firstName} {employee?.lastName}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <img
                  src={photoUrl}
                  alt="Foto capturada"
                  className="w-full h-64 object-cover rounded-lg mb-4"
                />

                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="text-sm text-gray-600">
                    <p>
                      <strong>Empleado:</strong> {employee?.firstName}{' '}
                      {employee?.lastName}
                    </p>
                    <p>
                      <strong>Fecha:</strong>{' '}
                      {new Date().toLocaleDateString('es-ES')}
                    </p>
                    <p>
                      <strong>Hora:</strong>{' '}
                      {new Date().toLocaleTimeString('es-ES')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={proceedToConfirm}
                  disabled={loading}
                  className="flex-1"
                >
                  Continuar
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    cleanup();
                    setStep('camera');
                  }}
                >
                  Repetir Foto
                </Button>
              </div>
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
              <CardTitle className="text-2xl">Confirmar Salida</CardTitle>
              <p className="text-gray-600">
                ¿Estás seguro de registrar tu salida?
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-orange-50 rounded-lg p-4 space-y-3">
                <div className="text-center">
                  <p className="text-lg font-semibold">
                    {employee?.firstName} {employee?.lastName}
                  </p>
                  <p className="text-sm text-gray-600">
                    {formatDate(new Date())}
                  </p>
                  <p className="text-2xl font-bold text-orange-600">
                    {formatTime(new Date())}
                  </p>
                </div>

                <div className="border-t pt-3">
                  <div className="flex justify-between text-sm">
                    <span>Entrada:</span>
                    <span className="font-medium">
                      {todayAttendance?.checkIn
                        ? formatTime(todayAttendance.checkIn)
                        : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Salida:</span>
                    <span className="font-medium">
                      {formatTime(new Date())}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Total:</span>
                    <span className="font-medium">
                      {calculateWorkedHours()}
                    </span>
                  </div>
                </div>
              </div>

              <Button
                onClick={confirmCheckOut}
                disabled={loading}
                className="w-full bg-orange-600 hover:bg-orange-700"
              >
                {loading ? 'Registrando...' : 'Confirmar Salida'}
              </Button>

              <Button
                variant="outline"
                onClick={() => setStep('review')}
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
                ¡Salida Registrada!
              </CardTitle>
              <p className="text-gray-600">
                Tu salida ha sido registrada exitosamente
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

                <div className="border-t pt-3">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Jornada Completada</p>
                    <p className="text-lg font-bold text-blue-600">
                      {calculateWorkedHours()}
                    </p>
                  </div>
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
                    cleanup();
                    setStep('auth');
                    setEmployeeId('');
                    setPin('');
                    setEmployee(null);
                    setTodayAttendance(null);
                    setNotes('');
                    setPhotoBlob(null);
                  }}
                  className="w-full"
                >
                  Registrar Otra Salida
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

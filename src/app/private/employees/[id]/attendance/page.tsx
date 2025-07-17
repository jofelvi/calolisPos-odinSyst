'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Employee } from '@/types/employee';
import { Attendance } from '@/types/attendance';
import { AttendanceStatusEnum } from '@/types/enumShared';
import {
  attendanceService,
  employeeService,
  fetchAllAttendancesByUserId,
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
  AlertCircleIcon,
  ArrowLeftIcon,
  CalendarIcon,
  CameraIcon,
  CheckCircleIcon,
  ClockIcon,
  EditIcon,
  MapPinIcon,
  PlusIcon,
  UserIcon,
  XCircleIcon,
} from 'lucide-react';
import AttendanceForm from '@/app/components/attendance/AttendanceForm';

export default function EmployeeAttendancePage() {
  const params = useParams();
  const router = useRouter();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showAttendanceForm, setShowAttendanceForm] = useState(false);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [cameraStep, setCameraStep] = useState<
    'camera' | 'location' | 'confirm'
  >('camera');
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
    accuracy: number;
  } | null>(null);
  const [checkInLoading, setCheckInLoading] = useState(false);

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

      // Fetch all attendances for the employee
      const allAttendances = await fetchAllAttendancesByUserId(employee.id);

      // Filter by selected month and year
      const filteredAttendances = allAttendances.filter((attendance) => {
        const attendanceDate = new Date(attendance.date);
        return (
          attendanceDate.getMonth() === selectedMonth - 1 &&
          attendanceDate.getFullYear() === selectedYear
        );
      });

      setAttendances(filteredAttendances);
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

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [cameraStream]);

  const handleCheckInStart = () => {
    if (!employee) return;

    // Validar que no hay un check-in activo sin check-out
    if (todayAttendance && !todayAttendance.checkOut) {
      setError(
        'Ya tienes una entrada registrada hoy. Debes registrar tu salida antes de hacer otra entrada.',
      );
      return;
    }

    setShowCheckInModal(true);
    setCameraStep('camera');
    setError(null);
  };

  const startCamera = async () => {
    try {
      setCheckInLoading(true);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
      });

      setCameraStream(stream);

      // Wait for video element to be available and set stream
      setTimeout(() => {
        const video = document.getElementById(
          'checkin-camera-video',
        ) as HTMLVideoElement;
        if (video) {
          video.srcObject = stream;
        }
      }, 100);
    } catch (error) {
      console.error('Error accessing camera:', error);
      setError('No se pudo acceder a la cámara. Verifica los permisos.');
    } finally {
      setCheckInLoading(false);
    }
  };

  const capturePhoto = async () => {
    try {
      const video = document.getElementById(
        'checkin-camera-video',
      ) as HTMLVideoElement;

      if (!video) {
        throw new Error('No se encontró el elemento de video');
      }

      if (video.readyState !== video.HAVE_ENOUGH_DATA) {
        throw new Error('El video no está listo para capturar');
      }

      if (video.videoWidth === 0 || video.videoHeight === 0) {
        throw new Error('Las dimensiones del video no son válidas');
      }

      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');

      if (!context) {
        throw new Error('No se pudo crear el contexto del canvas');
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0);

      // Convert to blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            setPhotoBlob(blob);
            setPhotoUrl(URL.createObjectURL(blob));

            // Stop camera stream
            if (cameraStream) {
              cameraStream.getTracks().forEach((track) => track.stop());
              setCameraStream(null);
            }

            setCameraStep('location');
          } else {
            setError('No se pudo generar la imagen. Intenta nuevamente.');
          }
        },
        'image/jpeg',
        0.8,
      );
    } catch (error) {
      console.error('Error capturing photo:', error);
      setError(
        `Error al capturar foto: ${error instanceof Error ? error.message : 'Error desconocido'}`,
      );
    }
  };

  const requestLocation = async () => {
    try {
      setCheckInLoading(true);

      if (!navigator.geolocation) {
        setError('Tu dispositivo no soporta geolocalización');
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
      setCameraStep('confirm');
    } catch {
      setError('No se pudo obtener tu ubicación. Verifica los permisos.');
    } finally {
      setCheckInLoading(false);
    }
  };

  const confirmCheckIn = async () => {
    if (!employee || !location) {
      setError('Faltan datos para completar el registro');
      return;
    }

    try {
      setCheckInLoading(true);

      const now = new Date();
      const deviceInfo = {
        userAgent: navigator.userAgent,
        timestamp: Date.now(),
        ipAddress: 'client-side',
      };

      const attendanceData = {
        employeeId: employee.id,
        date: now,
        checkIn: now,
        status: AttendanceStatusEnum.PRESENT,
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
          checkIn: {
            latitude: location.latitude,
            longitude: location.longitude,
            accuracy: location.accuracy,
          },
        },
        device: deviceInfo,
        notes: 'Registro automático de entrada con verificación',
        totalHours: 0,
        overtimeHours: 0,
        createdAt: now,
        updatedAt: now,
      };

      await attendanceService.create(attendanceData);
      await fetchAttendances();

      // Reset modal state
      setShowCheckInModal(false);
      setCameraStep('camera');
      setPhotoBlob(null);
      if (photoUrl) {
        URL.revokeObjectURL(photoUrl);
        setPhotoUrl(null);
      }
      setLocation(null);
      setError(null);

      // Success message
      setTimeout(() => {
        alert('¡Entrada registrada exitosamente!');
      }, 100);
    } catch (err) {
      console.error('Error registering check-in:', err);
      setError('Error al registrar entrada. Intenta nuevamente.');
    } finally {
      setCheckInLoading(false);
    }
  };

  const cancelCheckIn = () => {
    // Stop camera if running
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }

    // Clean up photo
    if (photoUrl) {
      URL.revokeObjectURL(photoUrl);
      setPhotoUrl(null);
    }

    // Reset state
    setShowCheckInModal(false);
    setCameraStep('camera');
    setPhotoBlob(null);
    setLocation(null);
    setError(null);
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
    const todayString = today.toDateString();

    const found = attendances.find((a) => {
      const attendanceDate = new Date(a.date);
      return attendanceDate.toDateString() === todayString;
    });
    console.log(attendances);
    // Debug log
    console.log('=== DEBUG getTodayAttendance ===');
    console.log('Today string:', todayString);
    console.log('All attendances:', attendances);
    console.log('Found today attendance:', found);
    if (found) {
      console.log('Found checkIn:', found.checkIn);
      console.log('Found checkOut:', found.checkOut);
      console.log('Has checkOut?', !!found.checkOut);
    }
    console.log('================================');

    return found;
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
          <Button
            onClick={() => setShowAttendanceForm(true)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <EditIcon className="h-4 w-4" />
            Registro Manual
          </Button>

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
            <Button
              onClick={handleCheckInStart}
              className="flex items-center gap-2"
            >
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

      {/* Modal para Registro Manual */}
      {showAttendanceForm && employee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <AttendanceForm
              employeeId={employee.id}
              employeeName={`${employee.firstName} ${employee.lastName}`}
              onSuccess={() => {
                setShowAttendanceForm(false);
                fetchAttendances();
              }}
              onCancel={() => setShowAttendanceForm(false)}
            />
          </div>
        </div>
      )}

      {/* Modal para Check-In con Cámara */}
      {showCheckInModal && employee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            {cameraStep === 'camera' && (
              <Card>
                <CardHeader className="text-center">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CameraIcon className="h-8 w-8 text-purple-600" />
                  </div>
                  <CardTitle className="text-xl">
                    Verificación de Identidad
                  </CardTitle>
                  <p className="text-gray-600">
                    Toma una foto para confirmar tu identidad
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-4">
                      <UserIcon className="h-5 w-5 text-gray-500" />
                      <span className="font-medium">
                        {employee.firstName} {employee.lastName}
                      </span>
                    </div>
                  </div>

                  {!cameraStream && !photoUrl && (
                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-4">
                        Presiona el botón para activar la cámara
                      </p>
                      <Button
                        onClick={startCamera}
                        disabled={checkInLoading}
                        className="w-full"
                      >
                        {checkInLoading
                          ? 'Iniciando cámara...'
                          : 'Activar Cámara'}
                      </Button>
                    </div>
                  )}

                  {cameraStream && !photoUrl && (
                    <div className="text-center space-y-4">
                      <div className="relative">
                        <video
                          id="checkin-camera-video"
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
                        <Button variant="outline" onClick={cancelCheckIn}>
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  )}

                  {photoUrl && (
                    <div className="text-center space-y-4">
                      <div className="relative">
                        <img
                          src={photoUrl}
                          alt="Foto capturada"
                          className="w-full h-64 object-cover rounded-lg"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => setCameraStep('location')}
                          className="flex-1"
                        >
                          Continuar
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            if (photoUrl) {
                              URL.revokeObjectURL(photoUrl);
                              setPhotoUrl(null);
                            }
                            setPhotoBlob(null);
                            startCamera();
                          }}
                        >
                          Repetir
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {cameraStep === 'location' && (
              <Card>
                <CardHeader className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MapPinIcon className="h-8 w-8 text-green-600" />
                  </div>
                  <CardTitle className="text-xl">Verificar Ubicación</CardTitle>
                  <p className="text-gray-600">Confirma tu ubicación actual</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-4">
                      <UserIcon className="h-5 w-5 text-gray-500" />
                      <span className="font-medium">
                        {employee.firstName} {employee.lastName}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                      Se requiere tu ubicación para registrar la entrada
                    </p>
                  </div>

                  <Button
                    onClick={requestLocation}
                    disabled={checkInLoading}
                    className="w-full"
                  >
                    {checkInLoading
                      ? 'Obteniendo ubicación...'
                      : 'Verificar Ubicación'}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={cancelCheckIn}
                    className="w-full"
                  >
                    Cancelar
                  </Button>
                </CardContent>
              </Card>
            )}

            {cameraStep === 'confirm' && (
              <Card>
                <CardHeader className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircleIcon className="h-8 w-8 text-blue-600" />
                  </div>
                  <CardTitle className="text-xl">Confirmar Registro</CardTitle>
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
                        {employee.firstName} {employee.lastName}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">
                        Fecha:
                      </span>
                      <span className="font-medium">
                        {formatDate(new Date())}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">
                        Hora:
                      </span>
                      <span className="font-medium">
                        {formatTime(new Date())}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">
                        Estado:
                      </span>
                      <Badge className="bg-green-100 text-green-800">
                        Presente
                      </Badge>
                    </div>

                    {location && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-600">
                          Ubicación:
                        </span>
                        <span className="text-sm text-green-600">
                          ✓ Verificada
                        </span>
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={confirmCheckIn}
                    disabled={checkInLoading}
                    className="w-full"
                  >
                    {checkInLoading ? 'Registrando...' : 'Confirmar Entrada'}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={cancelCheckIn}
                    className="w-full"
                  >
                    Cancelar
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

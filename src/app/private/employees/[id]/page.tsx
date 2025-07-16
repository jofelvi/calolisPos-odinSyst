'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Employee } from '@/types/employee';
import { employeeService } from '@/services/firebase/genericServices';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeftIcon,
  EditIcon,
  UserIcon,
  MailIcon,
  PhoneIcon,
  MapPinIcon,
  CalendarIcon,
  DollarSignIcon,
  ContactIcon,
  CreditCardIcon,
} from 'lucide-react';

export default function EmployeeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.id) {
      fetchEmployee(params.id as string);
    }
  }, [params.id]);

  const fetchEmployee = async (employeeId: string) => {
    try {
      setLoading(true);
      const employeeData = await employeeService.getById(employeeId);
      if (employeeData) {
        setEmployee(employeeData);
      } else {
        setError('Empleado no encontrado');
      }
    } catch {
      setError('Error al cargar empleado');
      // Error fetching employee - handled by error state
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.push('/private/employees');
  };

  const handleEdit = () => {
    router.push(`/private/employees/${employee?.id}/edit`);
  };

  const formatDate = (date: Date | string) => {
    if (!date) return 'No especificado';
    const d = new Date(date);
    return d.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">{error || 'Empleado no encontrado'}</p>
        <Button onClick={handleBack} className="mt-4">
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Volver a Empleados
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
          <h1 className="text-2xl font-bold">Detalles del Empleado</h1>
        </div>
        <Button onClick={handleEdit} className="flex items-center gap-2">
          <EditIcon className="h-4 w-4" />
          Editar
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserIcon className="h-5 w-5" />
                Información Personal
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">
                  {employee.firstName} {employee.lastName}
                </h2>
                <Badge variant={employee.isActive ? 'default' : 'secondary'}>
                  {employee.isActive ? 'Activo' : 'Inactivo'}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <MailIcon className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Email:</span>
                  <span className="font-medium">{employee.email}</span>
                </div>

                <div className="flex items-center gap-2">
                  <PhoneIcon className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Teléfono:</span>
                  <span className="font-medium">{employee.phone}</span>
                </div>

                <div className="flex items-start gap-2 md:col-span-2">
                  <MapPinIcon className="h-4 w-4 text-gray-500 mt-1" />
                  <span className="text-sm text-gray-600">Dirección:</span>
                  <span className="font-medium">{employee.address}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Información Laboral
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-600">Cargo:</span>
                  <p className="font-medium">{employee.position}</p>
                </div>

                <div>
                  <span className="text-sm text-gray-600">Departamento:</span>
                  <p className="font-medium">{employee.department}</p>
                </div>

                <div>
                  <span className="text-sm text-gray-600">
                    Fecha de Contratación:
                  </span>
                  <p className="font-medium">{formatDate(employee.hireDate)}</p>
                </div>

                <div className="flex items-center gap-2">
                  <DollarSignIcon className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Salario:</span>
                  <span className="font-medium">
                    {formatCurrency(employee.salary)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ContactIcon className="h-5 w-5" />
                Contacto de Emergencia
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <span className="text-sm text-gray-600">Nombre:</span>
                  <p className="font-medium">
                    {employee.emergencyContact.name}
                  </p>
                </div>

                <div>
                  <span className="text-sm text-gray-600">Teléfono:</span>
                  <p className="font-medium">
                    {employee.emergencyContact.phone}
                  </p>
                </div>

                <div>
                  <span className="text-sm text-gray-600">Relación:</span>
                  <p className="font-medium">
                    {employee.emergencyContact.relationship}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {employee.bankAccount && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCardIcon className="h-5 w-5" />
                  Información Bancaria
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <span className="text-sm text-gray-600">
                      Número de Cuenta:
                    </span>
                    <p className="font-medium">
                      {employee.bankAccount.accountNumber}
                    </p>
                  </div>

                  <div>
                    <span className="text-sm text-gray-600">Banco:</span>
                    <p className="font-medium">
                      {employee.bankAccount.bankName}
                    </p>
                  </div>

                  <div>
                    <span className="text-sm text-gray-600">
                      Tipo de Cuenta:
                    </span>
                    <p className="font-medium">
                      {employee.bankAccount.accountType}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Resumen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <UserIcon className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="font-semibold text-lg">
                  {employee.firstName} {employee.lastName}
                </h3>
                <p className="text-gray-600">{employee.position}</p>
                <p className="text-sm text-gray-500">{employee.department}</p>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Estado:</span>
                  <Badge variant={employee.isActive ? 'default' : 'secondary'}>
                    {employee.isActive ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Salario:</span>
                  <span className="font-medium">
                    {formatCurrency(employee.salary)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">
                    Fecha de Ingreso:
                  </span>
                  <span className="text-sm">
                    {formatDate(employee.hireDate)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">
                    Registro creado:
                  </span>
                  <span className="text-sm">
                    {formatDate(employee.createdAt)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Acciones Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() =>
                  router.push(`/private/employees/${employee.id}/attendance`)
                }
              >
                Ver Asistencias
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() =>
                  router.push(`/private/employees/${employee.id}/payroll`)
                }
              >
                Ver Nómina
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleEdit}
              >
                Editar Empleado
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

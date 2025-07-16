'use client';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ArrowLeftIcon, SaveIcon } from 'lucide-react';
import { EmployeeFormValues, employeeSchema } from '@/schemas/employeeSchema';
import { Employee } from '@/types/employee';

interface EmployeeFormProps {
  mode: 'create' | 'edit';
  initialData?: Employee;
  loading: boolean;
  error: string | null;
  onSubmit: (data: EmployeeFormValues) => void;
  onBack: () => void;
}

export default function EmployeeForm({
  mode,
  initialData,
  loading,
  error,
  onSubmit,
  onBack,
}: EmployeeFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EmployeeFormValues>({
    resolver: yupResolver(employeeSchema),
    defaultValues: initialData
      ? {
          firstName: initialData.firstName,
          lastName: initialData.lastName,
          email: initialData.email,
          phone: initialData.phone,
          address: initialData.address,
          position: initialData.position,
          department: initialData.department,
          hireDate: initialData.hireDate,
          salary: initialData.salary,
          isActive: initialData.isActive,
          pin: initialData.pin || null,
          emergencyContact: initialData.emergencyContact,
          bankAccount: initialData.bankAccount || {
            accountNumber: null,
            bankName: null,
            accountType: null,
          },
        }
      : {
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          address: '',
          position: '',
          department: '',
          hireDate: new Date(),
          salary: 0,
          isActive: true,
          pin: null,
          emergencyContact: {
            name: '',
            phone: '',
            relationship: '',
          },
          bankAccount: {
            accountNumber: null,
            bankName: null,
            accountType: null,
          },
        },
  });

  const isActive = watch('isActive');

  const formatDateForInput = (date: Date | string | undefined): string => {
    if (!date) return '';
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().split('T')[0];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <h1 className="text-2xl font-bold">
          {mode === 'create'
            ? 'Nuevo Empleado'
            : `Editar Empleado: ${initialData?.firstName} ${initialData?.lastName}`}
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información del Empleado</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-red-600">{error}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Input
                  label="Nombre"
                  required
                  {...register('firstName')}
                  placeholder="Ingrese el nombre"
                  error={errors.firstName}
                />
              </div>

              <div>
                <Input
                  label="Apellido"
                  required
                  {...register('lastName')}
                  placeholder="Ingrese el apellido"
                  error={errors.lastName}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Input
                  label="Email"
                  required
                  type="email"
                  {...register('email')}
                  placeholder="ejemplo@email.com"
                  error={errors.email}
                />
              </div>

              <div>
                <Input
                  label="Teléfono"
                  required
                  {...register('phone')}
                  placeholder="0412-1234567"
                  error={errors.phone}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="address">Dirección *</Label>
              <Textarea
                {...register('address')}
                placeholder="Ingrese la dirección completa"
                className={errors.address ? 'border-red-500' : ''}
              />
              {errors.address && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.address.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Input
                  label="Cargo"
                  required
                  {...register('position')}
                  placeholder="Ej: Cajero, Mesero, Chef"
                  error={errors.position}
                />
              </div>

              <div>
                <Input
                  label="Departamento"
                  required
                  {...register('department')}
                  placeholder="Ej: Ventas, Cocina, Administración"
                  error={errors.department}
                />
              </div>

              <div>
                <Input
                  label="Salario"
                  required
                  type="number"
                  {...register('salary', { valueAsNumber: true })}
                  placeholder="0"
                  error={errors.salary}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Input
                  label="Fecha de Contratación"
                  required
                  type="date"
                  {...register('hireDate', {
                    setValueAs: (value) =>
                      value ? new Date(value) : undefined,
                  })}
                  defaultValue={formatDateForInput(initialData?.hireDate)}
                  error={errors.hireDate}
                />
              </div>

              <div>
                <Input
                  label="PIN de Asistencia"
                  type="password"
                  {...register('pin')}
                  placeholder="4 dígitos (opcional)"
                  maxLength={4}
                  error={errors.pin}
                />
                <p className="text-sm text-gray-500 mt-1">
                  PIN de 4 dígitos para registro de asistencia
                </p>
              </div>
            </div>

            {mode === 'edit' && (
              <div className="flex items-center space-x-2">
                <Switch
                  checked={isActive}
                  onCheckedChange={(checked) => setValue('isActive', checked)}
                  label="Empleado Activo"
                />
              </div>
            )}

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Contacto de Emergencia</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Input
                    label="Nombre"
                    required
                    {...register('emergencyContact.name')}
                    placeholder="Nombre completo"
                    error={errors.emergencyContact?.name}
                  />
                </div>

                <div>
                  <Input
                    label="Teléfono"
                    required
                    {...register('emergencyContact.phone')}
                    placeholder="0412-1234567"
                    error={errors.emergencyContact?.phone}
                  />
                </div>

                <div>
                  <Input
                    label="Relación"
                    required
                    {...register('emergencyContact.relationship')}
                    placeholder="Ej: Padre, Madre, Esposo/a"
                    error={errors.emergencyContact?.relationship}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">
                Información Bancaria (Opcional)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Input
                    label="Número de Cuenta"
                    {...register('bankAccount.accountNumber')}
                    placeholder="0123456789"
                  />
                </div>

                <div>
                  <Input
                    label="Banco"
                    {...register('bankAccount.bankName')}
                    placeholder="Ej: Banesco, Mercantil"
                  />
                </div>

                <div>
                  <Input
                    label="Tipo de Cuenta"
                    {...register('bankAccount.accountType')}
                    placeholder="Ej: Corriente, Ahorro"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2"
              >
                <SaveIcon className="h-4 w-4" />
                {loading
                  ? 'Guardando...'
                  : mode === 'create'
                    ? 'Guardar Empleado'
                    : 'Guardar Cambios'}
              </Button>
              <Button type="button" variant="outline" onClick={onBack}>
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

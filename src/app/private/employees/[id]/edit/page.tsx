'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeftIcon } from 'lucide-react';
import { employeeService } from '@/services/firebase/genericServices';
import { Employee } from '@/types/employee';
import { EmployeeFormValues } from '@/schemas/employeeSchema';
import EmployeeForm from '@/app/components/employees/EmployeeForm';

export default function EditEmployeePage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [employee, setEmployee] = useState<Employee | null>(null);

  useEffect(() => {
    if (params.id) {
      fetchEmployee(params.id as string);
    }
  }, [params.id]);

  const fetchEmployee = async (employeeId: string) => {
    try {
      setFetchLoading(true);
      const employeeData = await employeeService.getById(employeeId);
      if (employeeData) {
        setEmployee(employeeData);
      } else {
        setError('Empleado no encontrado');
      }
    } catch {
      setError('Error al cargar empleado');
    } finally {
      setFetchLoading(false);
    }
  };
  const onSubmit = async (data: EmployeeFormValues) => {
    try {
      setLoading(true);
      setError(null);

      if (!employee) return;

      const updatedData: Partial<Omit<Employee, 'id'>> = {
        ...data,
        updatedAt: new Date(),
        bankAccount: data.bankAccount?.accountNumber
          ? data.bankAccount
          : null,
      };

      await employeeService.update(employee.id, updatedData);
      router.push(`/private/employees/${employee.id}`);
    } catch (err) {
      setError('Error al actualizar empleado');
      console.error('Error updating employee:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (employee) {
      router.push(`/private/employees/${employee.id}`);
    } else {
      router.push('/private/employees');
    }
  };

  if (fetchLoading) {
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

  if (employee) {
    return (
      <EmployeeForm
        mode="edit"
        initialData={employee}
        loading={loading}
        error={error}
        onSubmit={onSubmit}
        onBack={handleBack}
      />
    );
  }

  return null;
}

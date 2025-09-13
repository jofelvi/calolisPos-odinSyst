'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { employeeService } from '@/services/firebase/genericServices';
import { EmployeeFormValues } from '@/shared/schemas/employeeSchema';
import { Employee } from '@/modelTypes/employee';
import EmployeeForm from '@/features/employees/EmployeeForm';

export default function NewEmployeePage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const onSubmit = async (data: EmployeeFormValues) => {
    try {
      setLoading(true);
      setError(null);

      const employeeData: Omit<Employee, 'id'> = {
        ...data,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        bankAccount: data.bankAccount?.accountNumber ? data.bankAccount : null,
      };

      await employeeService.create(employeeData);
      router.push('/private/employees');
    } catch {
      setError('Error al crear empleado');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.push('/private/employees');
  };

  return (
    <EmployeeForm
      mode="create"
      loading={loading}
      error={error}
      onSubmitAction={onSubmit}
      onBackAction={handleBack}
    />
  );
}

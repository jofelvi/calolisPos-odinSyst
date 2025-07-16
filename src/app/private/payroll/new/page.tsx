'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeftIcon } from 'lucide-react';
import PayrollForm from '@/app/components/payroll/PayrollForm';

export default function NewPayrollPage() {
  const router = useRouter();

  const handleSuccess = (payrollId: string) => {
    router.push(`/private/payroll/${payrollId}`);
  };

  const handleCancel = () => {
    router.push('/private/payroll');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={() => router.push('/private/payroll')}
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Nueva Nómina</h1>
          <p className="text-gray-600">
            Calcula y registra una nueva nómina de empleado
          </p>
        </div>
      </div>

      <PayrollForm onSuccess={handleSuccess} onCancel={handleCancel} />
    </div>
  );
}

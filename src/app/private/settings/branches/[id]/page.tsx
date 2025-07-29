'use client';

import { useParams } from 'next/navigation';
import { BranchForm } from '@/features/settings/BranchForm';
import { useBranch } from '@/shared/hooks/useBranch';

export default function EditBranchPage() {
  const params = useParams();
  const branchId = params.id as string;
  const { availableBranches } = useBranch();

  const branch = availableBranches.find((b) => b.id === branchId);

  if (!branch) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900">
                Sucursal no encontrada
              </h2>
              <p className="text-gray-600 mt-2">
                La sucursal que intentas editar no existe
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-6 py-8">
        <BranchForm initialData={branch} isNew={false} />
      </div>
    </div>
  );
}

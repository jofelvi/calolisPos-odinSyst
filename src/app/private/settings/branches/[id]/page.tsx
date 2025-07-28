'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import { BackButton, Button } from '@/shared';
import { PRIVATE_ROUTES } from '@/shared/constantsRoutes/routes';
import { useBranchEditForm } from '@/features/settings/hooks/useSettingsForm';
import BranchForm from '@/features/settings/components/BranchForm/BranchForm';
import { BranchFormData } from '@/features/settings/schemas/branchSchemas';

export default function EditBranchPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const params = useParams();
  const branchId = params.id as string;

  const { form, branch, onSubmit } = useBranchEditForm(branchId);

  const handleFormSubmit = async (data: BranchFormData) => {
    setIsLoading(true);
    const success = await onSubmit(data);
    if (success) {
      router.push(PRIVATE_ROUTES.SETTINGS_BRANCHES);
    }
    setIsLoading(false);
  };

  if (!branch) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-cyan-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <BackButton href={PRIVATE_ROUTES.SETTINGS_BRANCHES} />
          <div>
            <h1 className="text-4xl font-bold text-gray-900">
              Editar Sucursal
            </h1>
            <p className="text-gray-600 text-lg">
              Modifica la información de {branch.name}
            </p>
          </div>
        </div>

        <form
          onSubmit={form.handleSubmit(handleFormSubmit)}
          className="space-y-8"
        >
          <BranchForm
            register={form.register}
            errors={form.formState.errors}
            showDefaultOption={true}
          />

          {/* Actions */}
          <div className="flex items-center justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(PRIVATE_ROUTES.SETTINGS_BRANCHES)}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading} isLoading={isLoading}>
              <Save className="w-4 h-4 mr-2" />
              Guardar Cambios
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

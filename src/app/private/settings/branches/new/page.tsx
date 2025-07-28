'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import { BackButton, Button } from '@/shared';
import { PRIVATE_ROUTES } from '@/shared/constantsRoutes/routes';
import { useNewBranchForm } from '@/features/settings/hooks/useSettingsForm';
import BranchForm from '@/features/settings/components/BranchForm/BranchForm';
import GeneralSettingsForm from '@/features/settings/components/SettingsForm/GeneralSettingsForm';
import { NewBranchFormData } from '@/features/settings/schemas/branchSchemas';

export default function NewBranchPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { form, onSubmit } = useNewBranchForm();

  const handleFormSubmit = async (data: NewBranchFormData) => {
    setIsLoading(true);
    const success = await onSubmit(data);
    if (success) {
      router.push(PRIVATE_ROUTES.SETTINGS_BRANCHES);
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <BackButton href={PRIVATE_ROUTES.SETTINGS_BRANCHES} />
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Nueva Sucursal</h1>
            <p className="text-gray-600 text-lg">
              Crea una nueva ubicación para tu negocio
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

          <GeneralSettingsForm
            register={form.register}
            errors={form.formState.errors}
            watch={form.watch}
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
              Crear Sucursal
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

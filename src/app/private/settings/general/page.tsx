'use client';

import { useState } from 'react';
import { ArrowLeft, Save } from 'lucide-react';
import { BackButton, Button } from '@/shared';
import { PRIVATE_ROUTES } from '@/shared/constantsRoutes/routes';
import { useGeneralSettingsForm } from '@/features/settings/hooks/useSettingsForm';
import GeneralSettingsForm from '@/features/settings/components/SettingsForm/GeneralSettingsForm';
import { GeneralSettingsFormData } from '@/features/settings/schemas/branchSchemas';

export default function GeneralSettingsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { form, currentBranch, onSubmit } = useGeneralSettingsForm();

  const handleFormSubmit = async (data: GeneralSettingsFormData) => {
    setIsLoading(true);
    await onSubmit(data);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <BackButton href={PRIVATE_ROUTES.SETTINGS} />
          <div>
            <h1 className="text-4xl font-bold text-gray-900">
              Configuración General
            </h1>
            <p className="text-gray-600 text-lg">
              Ajustes básicos del sistema para{' '}
              {currentBranch?.name || 'la sucursal seleccionada'}
            </p>
          </div>
        </div>

        <form
          onSubmit={form.handleSubmit(handleFormSubmit)}
          className="space-y-8"
        >
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
              onClick={() => window.history.back()}
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

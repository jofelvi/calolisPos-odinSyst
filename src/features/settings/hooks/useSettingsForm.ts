import React from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useBranch } from '@/shared/hooks/useBranch';
import { useToast } from '@/shared/hooks/useToast';
import {
  branchFormSchema,
  generalSettingsSchema,
  newBranchSchema,
  BranchFormData,
  GeneralSettingsFormData,
  NewBranchFormData,
} from '../schemas/branchSchemas';
import {
  defaultBranchValues,
  defaultGeneralSettingsValues,
} from '../utils/settingsConstants';
import {
  transformNewBranchFormData,
  transformNewBranchSettingsData,
  transformBranchSettingsToFormData,
  transformGeneralSettingsFormData,
} from '../utils/settingsTransformers';

/**
 * Hook for managing new branch form
 */
export const useNewBranchForm = () => {
  const { createBranch } = useBranch();
  const toast = useToast();

  const form = useForm<NewBranchFormData>({
    resolver: yupResolver(newBranchSchema),
    defaultValues: defaultBranchValues,
  });

  const onSubmit = async (data: NewBranchFormData) => {
    try {
      const branchData = transformNewBranchFormData(data);
      const settingsData = transformNewBranchSettingsData(data);
      
      // TODO: Update createBranch to accept settings data
      await createBranch(branchData);

      toast.success({
        title: 'Sucursal creada',
        description: `La sucursal "${data.name}" se ha creado correctamente`,
      });

      return true;
    } catch (error) {
      console.error('Error creating branch:', error);
      toast.error({
        title: 'Error al crear sucursal',
        description: 'No se pudo crear la sucursal. Inténtalo de nuevo.',
      });
      return false;
    }
  };

  return { form, onSubmit };
};

/**
 * Hook for managing branch edit form
 */
export const useBranchEditForm = (branchId?: string) => {
  const { availableBranches } = useBranch();
  const toast = useToast();

  const form = useForm<BranchFormData>({
    resolver: yupResolver(branchFormSchema),
  });

  const branch = branchId
    ? availableBranches.find((b) => b.id === branchId)
    : null;

  // Load branch data when available
  React.useEffect(() => {
    if (branch) {
      form.reset({
        name: branch.name,
        description: branch.description || '',
        address: branch.location?.address || '',
        city: branch.city,
        country: branch.country,
        phone: branch.phone || '',
        email: branch.email || '',
        isDefault: branch.isDefault || false,
      });
    }
  }, [branch, form]);

  const onSubmit = async (data: BranchFormData) => {
    if (!branch) return false;

    try {
      // TODO: Implement branch update functionality
      console.log('Branch update data:', { ...branch, ...data });

      toast.info({
        title: 'Funcionalidad pendiente',
        description: 'La edición de sucursales estará disponible próximamente',
      });

      return true;
    } catch (error) {
      console.error('Error updating branch:', error);
      toast.error({
        title: 'Error al actualizar sucursal',
        description: 'No se pudo actualizar la sucursal. Inténtalo de nuevo.',
      });
      return false;
    }
  };

  return { form, branch, onSubmit };
};

/**
 * Hook for managing general settings form
 */
export const useGeneralSettingsForm = () => {
  const { currentBranch, currentBranchSettings, updateBranchSettings } = useBranch();
  const toast = useToast();

  const form = useForm<GeneralSettingsFormData>({
    resolver: yupResolver(generalSettingsSchema),
    defaultValues: defaultGeneralSettingsValues,
  });

  // Load current branch settings
  React.useEffect(() => {
    if (currentBranchSettings) {
      const formData = transformBranchSettingsToFormData(currentBranchSettings);
      form.reset(formData);
    }
  }, [currentBranchSettings, form]);

  const onSubmit = async (data: GeneralSettingsFormData) => {
    if (!currentBranch) {
      toast.error({
        title: 'Error',
        description: 'No hay sucursal seleccionada',
      });
      return false;
    }

    try {
      const updatedSettings = transformGeneralSettingsFormData(data);
      await updateBranchSettings(updatedSettings);

      toast.success({
        title: 'Configuración guardada',
        description: 'Los ajustes generales se han actualizado correctamente',
      });

      return true;
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error({
        title: 'Error al guardar',
        description: 'No se pudieron guardar los cambios. Inténtalo de nuevo.',
      });
      return false;
    }
  };

  return { form, currentBranch, onSubmit };
};
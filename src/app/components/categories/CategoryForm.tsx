// components/categories/CategoryForm.tsx
'use client';

import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Category } from '@/types/category';
import {
  CategoryFormValues,
  categorySchema,
} from '../types/schemaYup/categorySchema';
import { uploadFile } from '@/services/firebase/uploadImage';
import { categoryService } from '@/services/firebase/genericServices';
import Image from 'next/image';
import { Input } from '@/components/shared/input/input';
import { FormErrorSummary } from '@/components/shared/formErrorSummary/FormErrorSummary';
import { Button } from '@/components/shared/button/Button';
import {
  FiCheckSquare,
  FiImage,
  FiInfo,
  FiSave,
  FiShoppingBag,
} from 'react-icons/fi';
import { MdOutlineCategory } from 'react-icons/md';

interface CategoryFormProps {
  initialData?: Category | null;
  isNew?: boolean;
  isFromProduct?: boolean;
  onClose?: () => void;
}

export function CategoryForm({
  initialData = null,
  isNew = false,
  isFromProduct,
  onClose,
}: CategoryFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CategoryFormValues>({
    resolver: yupResolver(categorySchema),
    defaultValues: {
      name: '',
      description: null,
      isActive: true,
      isForSale: true, // Nuevo campo: por defecto activo para venta
      imageUrl: null,
    },
  });

  // Cargar datos iniciales
  useEffect(() => {
    if (initialData) {
      reset({
        ...initialData,
        description: initialData.description || null,
        imageUrl: initialData.imageUrl || null,
        isForSale: initialData.isForSale ?? true, // Nuevo campo
      });
      if (initialData.imageUrl) {
        setImagePreview(initialData.imageUrl);
      }
    }
  }, [initialData, reset]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmitHandler = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleSubmit(handleFormSubmit)(e);
  };

  const handleFormSubmit = async (data: CategoryFormValues) => {
    setIsSubmitting(true);
    try {
      let uploadedImageUrl: string | null = null;
      if (imageFile) {
        uploadedImageUrl = await uploadFile(imageFile, 'categories');
      }

      const finalImageUrl = uploadedImageUrl || data.imageUrl;

      if (isNew) {
        const categoryToCreate: Omit<Category, 'id'> = {
          name: data.name,
          description: data.description,
          isActive: data.isActive,
          isForSale: data.isForSale, // Nuevo campo
          imageUrl: finalImageUrl,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        await categoryService.create(categoryToCreate);
      } else {
        if (!initialData || !initialData.id) {
          setIsSubmitting(false);
          return;
        }
        const categoryToUpdate: Category = {
          id: initialData.id,
          name: data.name,
          description: data.description,
          isActive: data.isActive,
          isForSale: data.isForSale, // Nuevo campo
          imageUrl: finalImageUrl,
          createdAt: initialData.createdAt,
          updatedAt: new Date(),
        };
        await categoryService.update(initialData.id, categoryToUpdate);
      }
      if (isFromProduct && onClose) {
        onClose();
      } else {
        router.push('/categories');
      }
    } catch {
      // console.error('Error al guardar la categoría:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelBtn = () =>
    onClose ? onClose() : router.push('/categories');

  return (
    <form
      onSubmit={onSubmitHandler}
      className="space-y-6 bg-white p-6 rounded-lg shadow-md"
    >
      <div className="flex items-center mb-6">
        <MdOutlineCategory className="text-2xl text-blue-600 mr-2" />
        <h2 className="text-xl font-semibold text-gray-800">
          {isNew ? 'Crear Nueva Categoría' : 'Editar Categoría'}
        </h2>
      </div>

      <FormErrorSummary errors={errors} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Campo Nombre */}
        <div className="md:col-span-2">
          <div className="flex items-center mb-1">
            <FiInfo className="text-gray-500 mr-2" />
            <label className="block text-sm font-medium text-gray-700">
              Nombre *
            </label>
          </div>
          <Input
            id="name"
            type="text"
            placeholder="Nombre de la categoría"
            {...register('name')}
            error={errors.name}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Campo Descripción */}
        <div className="md:col-span-2">
          <div className="flex items-center mb-1">
            <FiInfo className="text-gray-500 mr-2" />
            <label className="block text-sm font-medium text-gray-700">
              Descripción
            </label>
          </div>
          <textarea
            id="description"
            {...register('description')}
            rows={3}
            placeholder="Descripción de la categoría"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Campo Imagen */}
        <div className="md:col-span-2">
          <div className="flex items-center mb-1">
            <FiImage className="text-gray-500 mr-2" />
            <label className="block text-sm font-medium text-gray-700">
              Imagen
            </label>
          </div>
          <div className="flex flex-col space-y-2">
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <FiImage className="w-8 h-8 text-gray-400" />
                <p className="text-sm text-gray-500 mt-2">
                  <span className="font-semibold">Haz clic para subir</span> o
                  arrastra una imagen
                </p>
                <p className="text-xs text-gray-500">PNG, JPG (Max. 2MB)</p>
              </div>
              <input
                type="file"
                id="image"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>
            <input type="hidden" {...register('imageUrl')} />

            {imagePreview && (
              <div className="mt-2">
                <p className="text-sm text-gray-500 mb-1">Vista previa:</p>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <Image
                    src={imagePreview}
                    alt="Vista previa de la categoría"
                    className="object-cover w-full"
                    width={512}
                    height={200}
                    style={{ maxHeight: '200px' }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Campos de estado */}
        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Estado activo */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="flex items-center mb-3">
              <FiCheckSquare className="text-gray-500 mr-2" />
              <label className="block text-sm font-medium text-gray-700">
                Estado
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                {...register('isActive')}
                className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
              />
              <label
                htmlFor="isActive"
                className="ml-2 block text-sm text-gray-700"
              >
                Categoría activa
              </label>
            </div>
          </div>

          {/* Nuevo campo: Disponible para venta */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="flex items-center mb-3">
              <FiShoppingBag className="text-gray-500 mr-2" />
              <label className="block text-sm font-medium text-gray-700">
                Disponibilidad
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isForSale"
                {...register('isForSale')}
                className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
              />
              <label
                htmlFor="isForSale"
                className="ml-2 block text-sm text-gray-700"
              >
                Disponible para venta
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
        <Button
          type="button"
          variant="outline"
          onClick={() => handleCancelBtn()}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          color="primary"
          disabled={isSubmitting}
          isLoading={isSubmitting}
          startIcon={<FiSave />}
        >
          {isNew ? 'Crear Categoría' : 'Guardar Cambios'}
        </Button>
      </div>
    </form>
  );
}

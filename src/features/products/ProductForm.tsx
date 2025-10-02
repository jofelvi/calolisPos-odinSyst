'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useEffect, useState } from 'react';
import { Product } from '@/modelTypes/product';
import { Supplier } from '@/modelTypes/supplier';
import {
  categoryService,
  productService,
  supplierService,
} from '@/services/firebase/genericServices';
import {
  CurrencyEnum,
  ProductPresentationEnum,
  ProductTypeEnum,
} from '@/shared';
import { Category } from '@/modelTypes/category';
import { v4 as uuidv4 } from 'uuid';
import { storage } from '@/services/firebase/firebase';
import { ref } from 'firebase/storage';
import { getDownloadURL, uploadBytes } from '@firebase/storage';
import {
  ProductFormData,
  productSchema,
} from '../types/schemaYup/productSchema';
import ProductSuppliers from '@/features/products/ProductSuppliers';
import ProductImageUpload from '@/features/products/ProductImageUpload';
import ProductInventory from './ProductInventory';
import ProductPricing from '@/features/products/ProductPricing';
import ProductPresentation from './ProductPresentation';
import ProductBasicInfo from './ProductBasicInfo';
import FormActions from '@/features/forms/FormActions';
import CategoryModal from '@/features/products/CategoryModal';
import IngredientsManager from '@/features/products/IngredientsManager';
import {
  calculateMixedProductCost,
  mapFormDataToProduct,
  mapProductToFormData,
} from '@/features/products/productsUtils';
import { FormErrorSummary } from '@/components/shared/formErrorSummary/FormErrorSummary';
import Loader from '@/components/shared/Loader/Loader';
import { PRIVATE_ROUTES } from '@/shared';

interface ProductFormProps {
  initialData?: Product | null;
  isNew?: boolean;
}

export default function ProductForm({
  initialData = null,
  isNew = false,
}: ProductFormProps) {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);

  // Form setup
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    watch,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: yupResolver(productSchema),
    defaultValues: {
      isActive: true,
      isForSale: true,
      stock: 0,
      supplierIds: [],
      currency: CurrencyEnum.USD,
      type: ProductTypeEnum.BASE, // Cambiar de 'productType' a 'type'
      categoryId: '',
      name: '',
      description: null,
      price: 0,
      cost: 0,
      sku: null,
      barcode: null,
      minStock: null,
      imageUrl: null,
      presentation: ProductPresentationEnum.UNIT,
      presentationQuantity: 1,
      ingredients: [], // Agregar ingredi
      nivel: null,
    },
  });

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [categoriesData, suppliersData, productsData] = await Promise.all(
          [
            categoryService.getAll(),
            supplierService.getAll(),
            productService.getAll(),
          ],
        );

        setCategories(categoriesData);
        setSuppliers(suppliersData);
        setProducts(productsData);

        if (initialData) {
          const formData = mapProductToFormData(initialData);
          reset(formData);
          if (initialData.imageUrl) setImagePreview(initialData.imageUrl);
        }
      } catch {
        // Error loading form data - form will remain with default values
        // Consider showing a user-friendly error message here
      } finally {
        setIsLoading(false);
      }
    };

    void loadData();
  }, [initialData, reset]);

  // Subir imagen a Firebase Storage
  const uploadImage = async (file: File): Promise<string> => {
    const storageRef = ref(storage, `products/${uuidv4()}_${file.name}`);
    const snapshot = await uploadBytes(storageRef, file);
    return getDownloadURL(snapshot.ref);
  };

  // Manejar envío del formulario
  const onSubmit = async (data: ProductFormData) => {
    setIsSubmitting(true);
    try {
      let imageUrl = data.imageUrl;
      if (imageFile) imageUrl = await uploadImage(imageFile);

      // Calcular costo automáticamente para productos MIXED
      let finalCost = data.cost;
      if (data.type === ProductTypeEnum.MIXED && data.ingredients) {
        finalCost = calculateMixedProductCost(data.ingredients, products);
      }

      const finalData = {
        ...data,
        cost: finalCost,
        imageUrl,
      };

      if (isNew) {
        const productToCreate = mapFormDataToProduct(finalData);
        await productService.create(productToCreate);
      } else if (initialData?.id) {
        const productToUpdate = mapFormDataToProduct(finalData, initialData.id);
        await productService.update(initialData.id, productToUpdate);
      }

      router.push(PRIVATE_ROUTES.PRODUCTS);
    } catch {
      // Error saving product - consider showing a user-friendly error message
      // or implementing retry logic here
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Loader
        fullScreen
        text="Cargando categorías..."
        size="lg"
        color="primary"
      />
    );
  }
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Mostrar errores generales */}
      <FormErrorSummary errors={errors} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Información Básica */}
        <ProductBasicInfo
          register={register}
          errors={errors}
          categories={categories}
          onAddCategory={() => setShowCategoryModal(true)}
        />
        {/* Presentación */}
        <ProductPresentation
          control={control}
          register={register}
          errors={errors}
          watch={watch}
          setValue={setValue}
        />

        {/* Precios */}
        <ProductPricing register={register} errors={errors} watch={watch} />

        <IngredientsManager
          control={control}
          register={register}
          errors={errors}
          watch={watch}
          setValue={setValue} // Añadir esta prop
          products={products}
          isNew={isNew} // Agregar esta línea
        />
        {/* Inventario */}
        <ProductInventory register={register} errors={errors} />

        {/* Imagen */}
        <ProductImageUpload
          imagePreview={imagePreview}
          setImageFile={setImageFile}
          setImagePreview={setImagePreview}
          register={register}
        />

        {/* Proveedores */}
        <ProductSuppliers
          disabled={watch('type') === ProductTypeEnum.MIXED}
          register={register}
          suppliers={suppliers}
        />
      </div>

      {/* Acciones del formulario */}
      <FormActions
        isSubmitting={isSubmitting}
        isNew={isNew}
        onCancel={() => router.push(PRIVATE_ROUTES.PRODUCTS)}
      />

      {/* modal para nueva categoría */}
      <CategoryModal
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
      />
    </form>
  );
}

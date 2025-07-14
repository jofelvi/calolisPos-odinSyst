import { notFound } from 'next/navigation';
import ProductForm from '@/app/components/products/ProductForm';
import { productService } from '@/services/firebase/genericServices';
import BackIcon from '@/components/shared/BackButton/BackButton';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductEditPage({ params }: PageProps) {
  const { id } = await params;
  const productData = await productService.getById(id);

  if (!productData) return notFound();

  const product = {
    ...productData,
    createdAt: productData.createdAt ? new Date(productData.createdAt) : null,
    updatedAt: productData.updatedAt ? new Date(productData.updatedAt) : null,
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-1">Editar Producto</h1>
      <BackIcon href="/products" />
      <div className="bg-white shadow rounded-lg p-6">
        <ProductForm initialData={product} />
      </div>
    </div>
  );
}
